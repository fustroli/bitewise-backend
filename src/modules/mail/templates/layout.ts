import { config } from '../../../config/index.js';
import { IMailContent } from '../mail-transport.js';
import { escapeHtml } from './escape-html.js';

/** What a template says; plain strings, the layout owns all markup. */
export interface ILayoutInput {
  subject: string;
  // Inbox preview text, hidden in the body
  preheader: string;
  heading: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  // Why the recipient got this email
  reason: string;
}

// From bitewise-frontend's tailwind.config.ts / globals.css
const COLOR = {
  page: '#f7f7f8',
  card: '#ffffff',
  border: '#ececef',
  text: '#1d1d21',
  muted: '#6b6b71',
  primary: '#f9b115',
};
const FONT = "Poppins, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

const NO_REPLY = "This is an automated message; replies aren't read.";

/**
 * The branded layout every transactional email uses: wordmark, card with
 * heading, paragraphs and an optional button, then a footer. Inline styles
 * and tables only, no external resources. The text version says the same.
 */
export function renderLayout(input: ILayoutInput): IMailContent {
  return {
    subject: input.subject,
    html: renderHtml(input),
    text: renderText(input),
  };
}

function renderHtml({
  subject,
  preheader,
  heading,
  paragraphs,
  action,
  reason,
}: ILayoutInput): string {
  const e = escapeHtml;
  const site = e(config.FRONTEND_URL);

  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${COLOR.text};">${e(p)}</p>`,
    )
    .join('\n');

  const button = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
<tr><td align="center" bgcolor="${COLOR.primary}" style="border-radius:12px;background:${COLOR.primary};">
<a href="${e(action.url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:700;line-height:20px;color:${COLOR.text};text-decoration:none;border-radius:12px;">${e(action.label)}</a>
</td></tr>
</table>
<p style="margin:0;font-size:13px;line-height:20px;color:${COLOR.muted};">Button not working? Paste this link into your browser:<br>
<a href="${e(action.url)}" target="_blank" style="color:${COLOR.muted};word-break:break-all;">${e(action.url)}</a></p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${e(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.page};font-family:${FONT};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 8px 20px;font-size:24px;font-weight:700;letter-spacing:-0.5px;color:${COLOR.text};">BiteWise<span style="color:${COLOR.primary};">.</span></td></tr>
<tr><td style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:14px;padding:32px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:30px;font-weight:700;color:${COLOR.text};">${e(heading)}</h1>
${body}
${button}
</td></tr>
<tr><td align="center" style="padding:24px 8px 0;font-size:12px;line-height:18px;color:${COLOR.muted};">
<p style="margin:0 0 8px;">${e(reason)}</p>
<p style="margin:0 0 8px;">${e(NO_REPLY)}</p>
<p style="margin:0;"><a href="${site}" target="_blank" style="color:${COLOR.muted};">BiteWise · ${e(siteHost())}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function renderText({
  heading,
  paragraphs,
  action,
  reason,
}: ILayoutInput): string {
  return [
    'BiteWise.',
    heading,
    ...paragraphs,
    ...(action ? [`${action.label}: ${action.url}`] : []),
    '--',
    reason,
    NO_REPLY,
    `BiteWise · ${config.FRONTEND_URL}`,
  ].join('\n\n');
}

function siteHost(): string {
  return new URL(config.FRONTEND_URL).host;
}
