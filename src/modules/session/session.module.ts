import { Module } from '@nestjs/common';
import { SessionController } from './controller';
import { SessionService } from './service';

@Module({
  imports: [],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [],
})
export class SessionModule {}
