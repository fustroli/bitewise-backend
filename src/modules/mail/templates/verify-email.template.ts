import { IMailContent } from '../mail-transport.js';

/** `link` is trusted: built by the app, not taken from input. */
export function verifyEmailTemplate(link: string): IMailContent {
  return {
    subject: 'Verify your BiteWise email',
    html: `<p>Welcome to BiteWise!</p>
<p>Confirm your email address by opening this link within 24 hours:</p>
<p><a href="${link}">Verify my email</a></p>
<p>If you didn't sign up for BiteWise, you can ignore this email.</p>`,
    text: `Welcome to BiteWise!

Confirm your email address by opening this link within 24 hours:
${link}

If you didn't sign up for BiteWise, you can ignore this email.`,
  };
}
