import { Module } from '@nestjs/common';
import { config } from '../../config/index.js';
import { MailService } from './mail.service.js';
import { MailTransport } from './mail-transport.js';
import {
  LogMailTransport,
  SesMailTransport,
  SmtpMailTransport,
} from './transports/index.js';

const transports = {
  ses: SesMailTransport,
  smtp: SmtpMailTransport,
  log: LogMailTransport,
};

@Module({
  providers: [
    MailService,
    {
      provide: MailTransport,
      useFactory: () => new transports[config.MAIL.TRANSPORT](),
    },
  ],
  exports: [MailService],
})
export class MailModule {}
