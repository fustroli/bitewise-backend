import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from '../services/index.js';

/** Deletes expired Sessions hourly; every instance runs it, which is safe. */
@Injectable()
export class SessionCleanupTask {
  private readonly logger = new Logger(SessionCleanupTask.name);

  constructor(private readonly sessions: SessionService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpired(): Promise<void> {
    const deleted = await this.sessions.deleteExpired();
    if (deleted) this.logger.log(`Deleted ${deleted} expired sessions`);
  }
}
