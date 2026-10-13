import { Logger } from '@nestjs/common';
import { IMailMessage, MailTransport } from '../mail-transport.js';

/** Sends nothing; logs the envelope, and the body at debug level. */
export class LogMailTransport extends MailTransport {
  private readonly logger = new Logger(LogMailTransport.name);

  async send({ to, subject, text }: IMailMessage): Promise<void> {
    this.logger.log(`Mail to ${to}: ${subject}`);
    this.logger.debug(text);
  }
}
