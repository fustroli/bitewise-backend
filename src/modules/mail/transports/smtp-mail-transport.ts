import { createTransport } from 'nodemailer';
import { config } from '../../../config/index.js';
import { IMailMessage, MailTransport } from '../mail-transport.js';

/** Unauthenticated SMTP, for a local catcher like Mailpit. */
export class SmtpMailTransport extends MailTransport {
  private readonly transporter = createTransport({
    host: config.MAIL.SMTP_HOST,
    port: config.MAIL.SMTP_PORT,
  });

  async send(message: IMailMessage): Promise<void> {
    await this.transporter.sendMail(message);
  }
}
