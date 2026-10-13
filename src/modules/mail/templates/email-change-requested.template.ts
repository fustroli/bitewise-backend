import { IMailContent } from '../mail-transport.js';
import { renderLayout } from './layout.js';

/** Mailed to the old address when an Email change is requested. */
export function emailChangeRequestedTemplate(
  newEmail: string,
  cancelLink: string,
): IMailContent {
  return renderLayout({
    subject: 'Your BiteWise email is about to change',
    preheader: `Someone asked to change your BiteWise email to ${newEmail}.`,
    heading: 'Your email is about to change',
    paragraphs: [
      `Someone asked to change the sign-in email of your BiteWise account to ${newEmail}. It changes once that address is confirmed.`,
      "If this was you, there's nothing else to do. If it wasn't, cancel the change right away: cancelling signs you out on every device and clears your password, so you'll set a new one with a reset link sent to this address.",
      'The link expires in 24 hours.',
    ],
    action: { label: 'Cancel the change', url: cancelLink },
    reason:
      "You're receiving this because this address is the sign-in email of a BiteWise account.",
  });
}
