import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { ShutdownHealthIndicator } from './shutdown.health.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [ShutdownHealthIndicator],
})
export class HealthModule {}
