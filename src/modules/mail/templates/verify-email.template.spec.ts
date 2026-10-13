import { config } from '../../../config/index.js';
import { verifyEmailTemplate } from './verify-email.template.js';

describe('verifyEmailTemplate', () => {
  const link = 'https://app.test/verify-email?token=abc_-123';

  beforeAll(() => {
    config.FRONTEND_URL = 'https://app.test';
  });

  it('puts the link in both the html and the text', () => {
    const { subject, html, text } = verifyEmailTemplate(link);

    expect(subject).toBe('Verify your BiteWise email');
    expect(html).toContain(`href="${link}"`);
    expect(text).toContain(`Verify email: ${link}`);
    expect(text).toContain('expires in 24 hours');
  });
});
