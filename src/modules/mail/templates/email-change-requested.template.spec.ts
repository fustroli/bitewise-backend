import { config } from '../../../config/index.js';
import { emailChangeRequestedTemplate } from './email-change-requested.template.js';

describe('emailChangeRequestedTemplate', () => {
  const link = 'https://app.test/cancel-email-change?token=abc_-123';

  beforeAll(() => {
    config.FRONTEND_URL = 'https://app.test';
  });

  it('names the new address and links to the cancel page', () => {
    const { subject, html, text } = emailChangeRequestedTemplate(
      'new@example.com',
      link,
    );

    expect(subject).toBe('Your BiteWise email is about to change');
    expect(html).toContain(`href="${link}"`);
    expect(text).toContain('to new@example.com');
    expect(text).toContain(`Cancel the change: ${link}`);
  });

  it('escapes the new address in the html', () => {
    const { html } = emailChangeRequestedTemplate('<b>@example.com', link);

    expect(html).toContain('&lt;b&gt;@example.com');
    expect(html).not.toContain('<b>@example.com');
  });
});
