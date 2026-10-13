import { config } from '../../../config/index.js';
import { passwordResetTemplate } from './password-reset.template.js';

describe('passwordResetTemplate', () => {
  const link = 'https://app.test/reset-password?token=abc_-123';

  beforeAll(() => {
    config.FRONTEND_URL = 'https://app.test';
  });

  it('puts the link in both the html and the text', () => {
    const { subject, html, text } = passwordResetTemplate(link);

    expect(subject).toBe('Reset your BiteWise password');
    expect(html).toContain(`href="${link}"`);
    expect(text).toContain(`Reset password: ${link}`);
    expect(text).toContain('expires in 1 hour');
    expect(text).toContain("If you didn't ask for it, you can ignore");
  });
});
