import { config } from '../../../config/index.js';
import { emailChangeConfirmTemplate } from './email-change-confirm.template.js';

describe('emailChangeConfirmTemplate', () => {
  const link = 'https://app.test/confirm-email-change?token=abc_-123';

  beforeAll(() => {
    config.FRONTEND_URL = 'https://app.test';
  });

  it('puts the link in both the html and the text', () => {
    const { subject, html, text } = emailChangeConfirmTemplate(link);

    expect(subject).toBe('Confirm your new BiteWise email');
    expect(html).toContain(`href="${link}"`);
    expect(text).toContain(`Confirm email: ${link}`);
    expect(text).toContain('expires in 24 hours');
  });
});
