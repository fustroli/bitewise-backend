import { IMailContent } from '../mail-transport.js';
import { renderLayout } from './layout.js';

/** Mailed to the new address of an Email change. */
export function emailChangeConfirmTemplate(link: string): IMailContent {
  return renderLayout({
    subject: 'Confirm your new BiteWise email',
    preheader: 'Confirm this address to make it your BiteWise sign-in email.',
    heading: 'Confirm your new email',
    paragraphs: [
      'Someone asked to make this the sign-in email of their BiteWise account. Confirm it with the button below.',
      'The link expires in 24 hours. Confirming signs you out on your other devices.',
    ],
    action: { label: 'Confirm email', url: link },
    reason:
      "You're receiving this because this address was entered as the new email of a BiteWise account. If that wasn't you, you can ignore this email.",
  });
}
