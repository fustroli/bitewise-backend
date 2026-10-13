import { IMailContent } from '../mail-transport.js';
import { renderLayout } from './layout.js';

export function verifyEmailTemplate(link: string): IMailContent {
  return renderLayout({
    subject: 'Verify your BiteWise email',
    preheader: 'Confirm your email address to finish setting up BiteWise.',
    heading: 'Confirm your email',
    paragraphs: [
      'Welcome to BiteWise! Please confirm this is your email address.',
      'The link expires in 24 hours.',
    ],
    action: { label: 'Verify email', url: link },
    reason:
      "You're receiving this because this address was used to sign up for BiteWise. If that wasn't you, you can ignore this email.",
  });
}
