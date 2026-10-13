import { config } from '../../../config/index.js';
import { IMailContent } from '../mail-transport.js';
import { renderLayout } from './layout.js';

export function passwordChangedTemplate(): IMailContent {
  return renderLayout({
    subject: 'Your BiteWise password was changed',
    preheader: 'The password for your BiteWise account was just changed.',
    heading: 'Your password was changed',
    paragraphs: [
      'The password for your BiteWise account was just changed.',
      "If this was you, there's nothing else to do. If it wasn't, reset your password right away.",
    ],
    action: {
      label: 'Reset password',
      url: `${config.FRONTEND_URL}/forgot-password`,
    },
    reason:
      "You're receiving this because the password of the BiteWise account for this address was changed.",
  });
}
