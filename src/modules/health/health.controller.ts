import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/index.js';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ShutdownHealthIndicator } from './shutdown.health.js';

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly shutdown: ShutdownHealthIndicator,
  ) {}

  // Liveness: is the process up? No external dependencies, so an infra
  // restart doesn't cascade off of a flaky database.
  @Get()
  @HealthCheck()
  checkLiveness() {
    return this.health.check([]);
  }

  // Readiness: can the app actually serve traffic? Times out fast so a
  // stuck DB fails the check instead of hanging the caller. Down (503) once
  // shutdown starts, so the LB drains this instance before the server closes.
  @Get('ready')
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      () => this.shutdown.isAcceptingTraffic('shutdown'),
      () => this.db.pingCheck('database', { timeout: 1500 }),
    ]);
  }
}
