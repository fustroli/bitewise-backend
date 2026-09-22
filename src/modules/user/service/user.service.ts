import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/index.js';
import { CreateSocialUserDto, UpdateUserDto } from '../dto/index.js';
import { PersonalInformationService } from './personal-information.service.js';
import { SocialProfilesService } from './social-profiles.service.js';
import { NotificationSettingsService } from './notifications.service.js';
import { StorageService } from '../../storage/storage.service.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly personalInformationService: PersonalInformationService,
    private readonly socialProfilesService: SocialProfilesService,
    private readonly notificationSettingsService: NotificationSettingsService,
    private readonly storageService: StorageService,
  ) {}

  async deleteOne(id: number) {
    try {
      const user = await this.repository.findOne({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('No user found with the provided id.');
      }

      await this.repository.softDelete(id);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    const currentUser = await this.repository.findOne({
      where: {
        id,
      },
    });

    let updatedUser = await this.createOrUpdatePersonalInformation(
      data,
      currentUser,
    );
    updatedUser = await this.createOrUpdateSocialProfiles(data, currentUser);
    updatedUser = await this.createOrUpdateNotificationSettings(
      data,
      currentUser,
    );

    Object.assign(updatedUser, data);

    const savedUser = await this.repository.save(updatedUser);

    return savedUser;
  }

  private async createOrUpdatePersonalInformation(
    data: UpdateUserDto,
    currentUser: User,
  ) {
    const user: User = currentUser;

    if (data.personalInformation) {
      if (user.personalInformation && user.personalInformation.id) {
        await this.personalInformationService.updateOne(
          user.personalInformation.id,
          data.personalInformation,
        );
      } else {
        const newPersonalInformation =
          await this.personalInformationService.createOne(
            data.personalInformation,
          );

        user.personalInformation = newPersonalInformation;
      }
    }
    return user;
  }

  private async createOrUpdateSocialProfiles(
    data: UpdateUserDto,
    currentUser: User,
  ) {
    const user: User = currentUser;

    if (data.socialProfiles) {
      if (user.socialProfiles && user.socialProfiles.id) {
        await this.socialProfilesService.updateOne(
          user.socialProfiles.id,
          data.socialProfiles,
        );
      } else {
        const newSocialProfiles = await this.socialProfilesService.createOne(
          data.socialProfiles,
        );

        user.socialProfiles = newSocialProfiles;
      }
    }
    return user;
  }

  private async createOrUpdateNotificationSettings(
    data: UpdateUserDto,
    currentUser: User,
  ) {
    const user: User = currentUser;

    if (data.notificationSettings) {
      if (user.notificationSettings && user.notificationSettings.id) {
        await this.notificationSettingsService.updateOne(
          user.notificationSettings.id,
          data.notificationSettings,
        );
      } else {
        const newNotificationSettings =
          await this.notificationSettingsService.createOne(
            data.notificationSettings,
          );

        user.notificationSettings = newNotificationSettings;
      }
    }
    return user;
  }

  public async uploadAvatar(
    file: Express.Multer.File,
    userId: number,
  ): Promise<User> {
    if (!file) throw new BadRequestException('Uploading a file is required');

    const cloudStoragePath = await this.storageService.uploadFile(file);

    if (!cloudStoragePath)
      throw new ServiceUnavailableException(
        'Failed to upload file to Google Cloud Storage',
      );

    const user = await this.findById(userId);
    user.avatarUrl = cloudStoragePath;
    return this.repository.save(user);
  }

  async validateUser(userId: number) {
    const user = await this.repository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`No User with the provided id`);
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = this.repository.findOne({ where: { email } });
    if (!user) throw new NotFoundException();
    return user;
  }

  async findById(id: number) {
    const user = this.repository.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    return user;
  }

  async createUser(user: CreateSocialUserDto) {
    return this.repository.save(user);
  }
}
