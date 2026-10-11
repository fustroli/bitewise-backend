import { BeforeApplicationShutdown, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { setTimeout as sleep } from 'node:timers/promises';
import { config } from '../../config/index.js';

// Readiness goes down once shutdown starts. Nest runs beforeApplicationShutdown
// before it closes the HTTP server (and before TypeORM's pool closes), so
// waiting here keeps serving in-flight and late requests while an LB polling
// /api/health/ready notices and stops routing new ones here.
@Injectable()
export class ShutdownHealthIndicator implements BeforeApplicationShutdown {
  private shuttingDown = false;

  constructor(private readonly indicator: HealthIndicatorService) {}

  isAcceptingTraffic(key: string) {
    const check = this.indicator.check(key);
    return this.shuttingDown ? check.down('shutting down') : check.up();
  }

  async beforeApplicationShutdown(): Promise<void> {
    this.shuttingDown = true;
    if (config.SHUTDOWN_DRAIN_MS > 0) await sleep(config.SHUTDOWN_DRAIN_MS);
  }
}
