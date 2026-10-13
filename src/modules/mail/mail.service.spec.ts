import { Logger } from '@nestjs/common';
import { config } from '../../config/index.js';
import { IMailMessage, MailTransport } from './mail-transport.js';
import { MailService } from './mail.service.js';

const content = { subject: 'Subject', html: '<p>Hi</p>', text: 'Hi' };

describe('MailService', () => {
  const send = jest.fn<Promise<void>, [IMailMessage]>();
  const mail = new MailService({ send } as MailTransport);

  beforeAll(() => {
    config.MAIL.FROM = 'BiteWise <no-reply@example.com>';
  });

  beforeEach(() => send.mockReset());

  it('sends from MAIL_FROM to the recipient', async () => {
    await mail.send('user@example.com', content);

    expect(send).toHaveBeenCalledWith({
      from: 'BiteWise <no-reply@example.com>',
      to: 'user@example.com',
      ...content,
    });
  });

  it('logs a failed send instead of rejecting', async () => {
    const error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    send.mockRejectedValueOnce(new Error('SES down'));

    await expect(
      mail.send('user@example.com', content),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      'Failed to send "Subject": Error: SES down',
    );
    error.mockRestore();
  });
});
