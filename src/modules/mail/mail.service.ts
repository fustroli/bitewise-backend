import { Injectable, Logger } from '@nestjs/common';
import { config } from '../../config/index.js';
import { IMailContent, MailTransport } from './mail-transport.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly transport: MailTransport) {}

  /**
   * Fire-and-forget: never rejects, a failed send is only logged. Callers
   * don't await it, so a slow provider never holds up the request.
   */
  async send(to: string, content: IMailContent): Promise<void> {
    try {
      await this.transport.send({ from: config.MAIL.FROM, to, ...content });
    } catch (error) {
      this.logger.error(`Failed to send "${content.subject}"`, error);
    }
  }
}
