import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { config } from '../../../config/index.js';
import { IMailMessage, MailTransport } from '../mail-transport.js';

/** Credentials come from the AWS SDK default provider chain. */
export class SesMailTransport extends MailTransport {
  private readonly client = new SESv2Client({ region: config.MAIL.AWS_REGION });

  async send({ from, to, subject, html, text }: IMailMessage): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              Text: { Data: text, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
  }
}
