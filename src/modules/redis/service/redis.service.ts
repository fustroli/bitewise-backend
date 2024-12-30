import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import Redis from 'ioredis'; // eslint-disable-line

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async onModuleInit() {
    // Optional: Handle any initialization logic
    console.log('RedisService initialized');
  }

  async onModuleDestroy() {
    // Close the connection when the module is destroyed
    await this.client.quit();
    console.log('RedisService connection closed');
  }

  getClient(): Redis {
    return this.client;
  }
}
