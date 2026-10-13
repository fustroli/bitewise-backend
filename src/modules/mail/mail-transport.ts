/** What a template renders: the parts of an email that aren't addressing. */
export interface IMailContent {
  subject: string;
  html: string;
  text: string;
}

export interface IMailMessage extends IMailContent {
  from: string;
  to: string;
}

/** Port for sending email; adapters are SES, SMTP (local dev) and log (tests). */
export abstract class MailTransport {
  abstract send(message: IMailMessage): Promise<void>;
}
