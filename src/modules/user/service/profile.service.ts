import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/index.js';
import { EmailVerificationToken, Session } from '../../auth/entities/index.js';
import { ETokenPurpose } from '../../auth/enum/index.js';
import { ProfilePatchDto } from '../dto/index.js';
import { FileStore } from '../../storage/index.js';
import {
  AVATAR_CACHE_CONTROL,
  AVATAR_CONTENT_TYPE,
  avatarKey,
  encodeAvatar,
} from '../avatar/index.js';

export interface IPendingEmailChange {
  email: string;
  expiresAt: Date;
}

const GROUPS = ['personalInformation', 'socialProfiles', 'bodyStats'] as const;

/** The authenticated User's Profile. Never reads or writes credentials. */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private readonly tokens: Repository<EmailVerificationToken>,
    private readonly files: FileStore,
  ) {}

  async getProfile(userId: number): Promise<User> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user)
      throw new NotFoundException('No user found with the provided id.');
    return user;
  }

  /** The User's unconfirmed Email change, if any. */
  async getPendingEmailChange(
    userId: number,
  ): Promise<IPendingEmailChange | null> {
    const pending = await this.tokens.findOne({
      where: {
        user: { id: userId },
        purpose: ETokenPurpose.EMAIL_CHANGE,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { id: 'DESC' },
    });
    return pending
      ? { email: pending.newEmail, expiresAt: pending.expiresAt }
      : null;
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
   * Ends every Session of the User.
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
        bodyStats: {
          sex: null,
          heightCm: null,
          weightKg: null,
          activityLevel: null,
          neckCm: null,
          waistCm: null,
          hipCm: null,
        },
        avatarKey: null,
      });
      await manager.softDelete(User, user.id);
      await manager.delete(Session, { user: { id: user.id } });
    });

    await this.deleteAvatarFile(user.avatarKey);
  }

  /**
   * Upload new, save the User, then best-effort delete the old object.
   * Needs a verified email: avatars are publicly served from the CDN.
   */
  public async uploadAvatar(
    file: Express.Multer.File,
    userId: number,
  ): Promise<User> {
    if (!file) throw new BadRequestException('Uploading a file is required');

    const user = await this.getProfile(userId);
    if (!user.emailVerified)
      throw new ForbiddenException(
        'Verify your email address to upload an avatar',
      );
    const body = await encodeAvatar(file);
    const previousKey = user.avatarKey;
    const key = avatarKey(userId);

    try {
      await this.files.put(key, body, {
        contentType: AVATAR_CONTENT_TYPE,
        cacheControl: AVATAR_CACHE_CONTROL,
      });
    } catch (error) {
      this.logger.error(`Avatar upload failed: ${String(error)}`);
      throw new InternalServerErrorException('Failed to store the avatar');
    }

    user.avatarKey = key;
    let saved: User;
    try {
      saved = await this.users.save(user);
    } catch (error) {
      await this.deleteAvatarFile(key);
      throw error;
    }

    await this.deleteAvatarFile(previousKey);
    return saved;
  }

  /** A failed delete leaves an orphan; it is logged, never surfaced. */
  private async deleteAvatarFile(key: string | null): Promise<void> {
    if (!key) return;
    try {
      await this.files.delete(key);
    } catch (error) {
      this.logger.warn(`Failed to delete avatar ${key}: ${String(error)}`);
    }
  }
}
