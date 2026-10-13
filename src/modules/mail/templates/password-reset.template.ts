import { IMailContent } from '../mail-transport.js';
import { renderLayout } from './layout.js';

export function passwordResetTemplate(link: string): IMailContent {
  return renderLayout({
    subject: 'Reset your BiteWise password',
    preheader: 'Choose a new password for your BiteWise account.',
    heading: 'Reset your password',
    paragraphs: [
      'Someone asked to reset the password for your BiteWise account. Choose a new one with the button below.',
      'The link expires in 1 hour. Resetting signs you out on every device.',
    ],
    action: { label: 'Reset password', url: link },
    reason:
      "You're receiving this because a password reset was requested for this address. If you didn't ask for it, you can ignore this email; your password stays the same.",
  });
}
