import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/index.js';
import { ProfilePatchDto } from '../dto/index.js';
import { StorageService } from '../../storage/storage.service.js';

const GROUPS = [
  'personalInformation',
  'socialProfiles',
  'notificationSettings',
] as const;

/** The authenticated User's Profile. Never reads or writes credentials. */
@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly storageService: StorageService,
  ) {}

  async getProfile(userId: number): Promise<User> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user)
      throw new NotFoundException('No user found with the provided id.');
    return user;
  }

  /** Username clashes surface as 409 through DuplicateEntryFilter. */
  async updateProfile(userId: number, patch: ProfilePatchDto): Promise<User> {
    const user = await this.getProfile(userId);

    for (const group of GROUPS) {
      for (const [field, value] of Object.entries(patch[group] ?? {}))
        if (value !== undefined) user[group][field] = value;
    }

    return this.users.save(user);
  }

  /**
   * Soft-deletes the User and erases their Profile. The row stays so Owned
   * resources keep a valid Owner; the email becomes free to sign up again.
   */
  async deleteAccount(userId: number): Promise<void> {
    const user = await this.getProfile(userId);

    await this.users.manager.transaction(async (manager) => {
      await manager.update(User, user.id, {
        personalInformation: {
          userName: null,
          firstName: null,
          lastName: null,
          phoneNumber: null,
          dateOfBirth: null,
        },
        socialProfiles: {
          facebook: null,
          twitter: null,
          instagram: null,
          linkedin: null,
        },
        notificationSettings: {
          defaultEmailAddress: null,
          communicationEmail: false,
          marketingEmail: false,
          securityEmail: true,
        },
        avatarUrl: null,
      });
      await manager.softDelete(User, user.id);
    });
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

    const user = await this.getProfile(userId);
    user.avatarUrl = cloudStoragePath;
    return this.users.save(user);
  }
}
