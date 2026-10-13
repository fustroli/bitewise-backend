import { config } from '../../../config/index.js';
import { passwordChangedTemplate } from './password-changed.template.js';

describe('passwordChangedTemplate', () => {
  beforeAll(() => {
    config.FRONTEND_URL = 'https://app.test';
  });

  it('links to the forgot-password page', () => {
    const { subject, html, text } = passwordChangedTemplate();

    expect(subject).toBe('Your BiteWise password was changed');
    expect(html).toContain('href="https://app.test/forgot-password"');
    expect(text).toContain('Reset password: https://app.test/forgot-password');
  });
});
