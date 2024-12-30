import { Module } from '@nestjs/common';
import Redis from 'ioredis'; // eslint-disable-line
import { RedisService } from './service';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis('redis://localhost:6379'); // Replace with your Redis connection URL
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
