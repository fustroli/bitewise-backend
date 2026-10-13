import { config } from '../../../config/index.js';
import { ILayoutInput, renderLayout } from './layout.js';

const input: ILayoutInput = {
  subject: 'Subject line',
  preheader: 'Preview text',
  heading: 'A heading',
  paragraphs: ['First paragraph.', 'Second paragraph.'],
  action: { label: 'Do it', url: 'https://app.test/do?token=abc' },
  reason: 'You got this because of a test.',
};

// Set before the describe blocks render at collection time
config.FRONTEND_URL = 'https://app.test';

describe('renderLayout', () => {
  describe('html', () => {
    const { html } = renderLayout(input);

    it.each([
      'Preview text',
      'A heading',
      'First paragraph.',
      'Second paragraph.',
      'You got this because of a test.',
      "replies aren't read.",
    ])('contains %p', (text) => {
      expect(html).toContain(text.replace("'", '&#39;'));
    });

    it('links the button and the fallback to the action', () => {
      const hrefs = html.match(/href="https:\/\/app\.test\/do\?token=abc"/g);
      expect(hrefs).toHaveLength(2);
      expect(html).toContain('>Do it</a>');
    });

    it('links the site in the footer', () => {
      expect(html).toContain('href="https://app.test"');
      expect(html).toContain('BiteWise · app.test');
    });

    it('loads no external resources', () => {
      expect(html).not.toMatch(/<img|<link|src=|url\(/);
    });
  });

  describe('text', () => {
    const { subject, text } = renderLayout(input);

    it('says the same as the html, without markup', () => {
      for (const part of [
        'BiteWise.',
        'A heading',
        'First paragraph.',
        'Second paragraph.',
        'Do it: https://app.test/do?token=abc',
        'You got this because of a test.',
        "replies aren't read.",
        'https://app.test',
      ]) {
        expect(text).toContain(part);
      }
      expect(text).not.toMatch(/<[a-z/]/i);
      expect(subject).toBe('Subject line');
    });
  });

  it('escapes every value in the html', () => {
    const { html } = renderLayout({
      ...input,
      heading: '<script>alert(1)</script>',
      paragraphs: ['Tom & "Jerry"'],
      action: { label: 'Go', url: 'https://app.test/?a="><b>' },
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Tom &amp; &quot;Jerry&quot;');
    expect(html).toContain('href="https://app.test/?a=&quot;&gt;&lt;b&gt;"');
  });

  it('leaves out the button when there is no action', () => {
    const { html, text } = renderLayout({ ...input, action: undefined });

    expect(html).not.toContain('Button not working?');
    expect(text).not.toContain('Do it');
  });
});
