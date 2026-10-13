import { config } from '../../../config/index.js';
import { emailChangedTemplate } from './email-changed.template.js';

describe('emailChangedTemplate', () => {
  beforeAll(() => {
    config.FRONTEND_URL = 'https://app.test';
  });

  it('names the new address and has no button', () => {
    const { subject, html, text } = emailChangedTemplate('new@example.com');

    expect(subject).toBe('Your BiteWise email was changed');
    expect(text).toContain('changed to new@example.com');
    expect(html).not.toContain('Button not working');
  });
});
