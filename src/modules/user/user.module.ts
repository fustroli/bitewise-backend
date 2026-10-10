import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ProfileService } from './service/index.js';
import { StorageService } from '../storage/storage.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/index.js';
import { UserController } from './controller/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PassportModule.register({})],
  controllers: [UserController],
  providers: [ProfileService, StorageService],
})
export class UserModule {}
