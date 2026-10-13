import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailVerificationService } from '../services/index.js';

/** Deletes expired Email verification tokens hourly; safe on every instance. */
@Injectable()
export class EmailVerificationCleanupTask {
  private readonly logger = new Logger(EmailVerificationCleanupTask.name);

  constructor(private readonly verification: EmailVerificationService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpired(): Promise<void> {
    const deleted = await this.verification.deleteExpired();
    if (deleted)
      this.logger.log(`Deleted ${deleted} expired email verification tokens`);
  }
}
