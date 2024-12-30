import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/service';

@Injectable()
export class SessionService {
  constructor(private readonly redisService: RedisService) {}
  async getSession(sessionId: string): Promise<any> {
    const client = this.redisService.getClient();
    const sessionData = await client.get(`sess:${sessionId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  }
  async invalidateSession(sessionId: string): Promise<void> {
    const client = this.redisService.getClient();
    await client.del(`sess:${sessionId}`);
  }
  async invalidateAllSessions(userId: string): Promise<void> {
    const client = this.redisService.getClient();
    const keys = await client.keys(`sess:*`);
    for (const key of keys) {
      const sessionData = JSON.parse(await client.get(key));
      if (sessionData?.user?.id === userId) {
        await client.del(key);
      }
    }
  }
}
