import { IMailContent } from '../mail-transport.js';
import { renderLayout } from './layout.js';

/** Mailed to the old address once an Email change is confirmed. */
export function emailChangedTemplate(newEmail: string): IMailContent {
  return renderLayout({
    subject: 'Your BiteWise email was changed',
    preheader: `Your BiteWise sign-in email is now ${newEmail}.`,
    heading: 'Your email was changed',
    paragraphs: [
      `The sign-in email of your BiteWise account was changed to ${newEmail}. Sign in with it from now on.`,
      'This address no longer receives emails about your account.',
    ],
    reason:
      "You're receiving this because this address was the sign-in email of a BiteWise account.",
  });
}
