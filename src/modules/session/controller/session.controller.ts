import { Controller, Delete, Get, Param } from '@nestjs/common';

import { SessionService } from '../service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}
  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.getSession(sessionId);
  }
  @Delete(':sessionId')
  async invalidateSession(@Param('sessionId') sessionId: string) {
    await this.sessionService.invalidateSession(sessionId);
    return { message: 'Session invalidated' };
  }
  @Delete('/user/:userId')
  async invalidateAllSessions(@Param('userId') userId: string) {
    await this.sessionService.invalidateAllSessions(userId);
    return { message: 'All sessions invalidated for user' };
  }
}
