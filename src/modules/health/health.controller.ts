import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  // Liveness: is the process up? No external dependencies, so an infra
  // restart doesn't cascade off of a flaky database.
  @Get()
  @HealthCheck()
  checkLiveness() {
    return this.health.check([]);
  }

  // Readiness: can the app actually serve traffic? Times out fast so a
  // stuck DB fails the check instead of hanging the caller.
  @Get('ready')
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1500 }),
    ]);
  }
}
