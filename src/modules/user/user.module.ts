import {
  NotificationSettings,
  PersonalInformation,
  SocialProfiles,
  User,
} from './entities/index.js';
import {
  NotificationSettingsService,
  PersonalInformationService,
  SocialProfilesService,
  UserService,
} from './service/index.js';

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StorageService } from '../storage/storage.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controller/index.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      PersonalInformation,
      SocialProfiles,
      NotificationSettings,
    ]),
    PassportModule.register({}),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    PersonalInformationService,
    SocialProfilesService,
    NotificationSettingsService,
    StorageService,
  ],
  exports: [
    UserService,
    PersonalInformationService,
    SocialProfilesService,
    NotificationSettingsService,
    StorageService,
  ],
})
export class UserModule {}
