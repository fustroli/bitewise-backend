import { BadRequestException, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';
import { DataSource } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../../test/int/test-database.js';
import { toConflict } from '../../../common/filters/index.js';
import { Session } from '../../auth/entities/index.js';
import { InMemoryFileStore } from '../../storage/index.js';
import { User } from '../entities/index.js';
import { EActivityLevel, ESex } from '../enum/index.js';
import { ProfileService } from './profile.service.js';

const uniqueUserName = () => `john_${randomUUID().split('-')[0]}`;

const EMPTY_PERSONAL_INFORMATION = {
  userName: null,
  firstName: null,
  lastName: null,
  phoneNumber: null,
  dateOfBirth: null,
};
const EMPTY_SOCIAL_PROFILES = {
  facebook: null,
  twitter: null,
  instagram: null,
  linkedin: null,
};
const EMPTY_BODY_STATS = {
  sex: null,
  heightCm: null,
  weightKg: null,
  activityLevel: null,
  neckCm: null,
  waistCm: null,
  hipCm: null,
};

describe('ProfileService', () => {
  let dataSource: DataSource;
  let profiles: ProfileService;
  let user: User;
  let files: InMemoryFileStore;

  const conflictOf = (promise: Promise<unknown>) =>
    promise.then(
      () => null,
      (error) => toConflict(error),
    );

  const reload = (id: number) =>
    dataSource
      .getRepository(User)
      .findOne({ where: { id }, withDeleted: true });

  beforeAll(async () => {
    dataSource = await connectTestDatabase(await createTestDatabase());
  });

  afterAll(() => dataSource.destroy());

  beforeEach(async () => {
    user = await createUser(dataSource);
    files = new InMemoryFileStore();
    profiles = new ProfileService(dataSource.getRepository(User), files);
  });

  const upload = (owner: User, buffer: Buffer, mimetype = 'image/png') =>
    profiles.uploadAvatar(
      { buffer, mimetype } as Express.Multer.File,
      owner.id,
    );

  const SOURCE_WIDTH = 800;
  const SOURCE_HEIGHT = 600;
  const png = (width = SOURCE_WIDTH, height = SOURCE_HEIGHT) =>
    sharp({
      create: { width, height, channels: 3, background: '#336699' },
    })
      .withExif({ IFD0: { Copyright: 'secret' } })
      .png()
      .toBuffer();

  describe('getProfile', () => {
    it('returns every Profile group, defaulted for a new User', async () => {
      const profile = await profiles.getProfile(user.id);

      expect(profile.personalInformation).toEqual(EMPTY_PERSONAL_INFORMATION);
      expect(profile.socialProfiles).toEqual(EMPTY_SOCIAL_PROFILES);
      expect(profile.bodyStats).toEqual(EMPTY_BODY_STATS);
      expect(profile.notificationSettings).toEqual({
        defaultEmailAddress: null,
        communicationEmail: false,
        marketingEmail: false,
        securityEmail: true,
      });
    });

    it('404s for a deleted User', async () => {
      await profiles.deleteAccount(user.id);

      await expect(profiles.getProfile(user.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    beforeEach(() =>
      profiles.updateProfile(user.id, {
        personalInformation: { firstName: 'John', lastName: 'Doe' },
        socialProfiles: { twitter: 'https://twitter.com/john' },
        notificationSettings: { marketingEmail: true },
      }),
    );

    it('leaves a missing group unchanged', async () => {
      await profiles.updateProfile(user.id, {
        personalInformation: { firstName: 'Jane' },
      });

      const profile = await profiles.getProfile(user.id);
      expect(profile.socialProfiles.twitter).toBe('https://twitter.com/john');
      expect(profile.notificationSettings.marketingEmail).toBe(true);
    });

    it('leaves a missing field unchanged', async () => {
      await profiles.updateProfile(user.id, {
        personalInformation: { firstName: 'Jane' },
      });

      const { personalInformation } = await profiles.getProfile(user.id);
      expect(personalInformation).toMatchObject({
        firstName: 'Jane',
        lastName: 'Doe',
      });
    });

    it('clears a field set to null', async () => {
      await profiles.updateProfile(user.id, {
        personalInformation: { lastName: null },
        socialProfiles: { twitter: null },
      });

      const profile = await profiles.getProfile(user.id);
      expect(profile.personalInformation).toMatchObject({
        firstName: 'John',
        lastName: null,
      });
      expect(profile.socialProfiles.twitter).toBeNull();
    });

    it('returns the updated Profile', async () => {
      const profile = await profiles.updateProfile(user.id, {
        notificationSettings: { defaultEmailAddress: 'news@example.com' },
      });

      expect(profile.notificationSettings).toMatchObject({
        defaultEmailAddress: 'news@example.com',
        marketingEmail: true,
      });
    });
  });

  describe('Body stats', () => {
    const BODY_STATS = {
      sex: ESex.FEMALE,
      heightCm: 170,
      weightKg: 64.5,
      activityLevel: EActivityLevel.MODERATE,
      neckCm: 32.5,
      waistCm: 71,
      hipCm: 96.5,
    };

    beforeEach(() =>
      profiles.updateProfile(user.id, { bodyStats: BODY_STATS }),
    );

    it('stores every field, decimals as numbers', async () => {
      const { bodyStats } = await profiles.getProfile(user.id);

      expect(bodyStats).toEqual(BODY_STATS);
      expect(typeof bodyStats.weightKg).toBe('number');
      expect(typeof bodyStats.neckCm).toBe('number');
    });

    it('leaves missing fields unchanged', async () => {
      await profiles.updateProfile(user.id, { bodyStats: { weightKg: 63.2 } });

      const { bodyStats } = await profiles.getProfile(user.id);
      expect(bodyStats).toEqual({ ...BODY_STATS, weightKg: 63.2 });
    });

    it('leaves missing measurements unchanged', async () => {
      await profiles.updateProfile(user.id, { bodyStats: { waistCm: 74.5 } });

      const { bodyStats } = await profiles.getProfile(user.id);
      expect(bodyStats).toEqual({ ...BODY_STATS, waistCm: 74.5 });
    });

    it('clears a field set to null', async () => {
      await profiles.updateProfile(user.id, {
        bodyStats: { weightKg: null, activityLevel: null, hipCm: null },
      });

      const { bodyStats } = await profiles.getProfile(user.id);
      expect(bodyStats).toEqual({
        ...BODY_STATS,
        weightKg: null,
        activityLevel: null,
        hipCm: null,
      });
    });

    it('is left unchanged by a patch to another group', async () => {
      await profiles.updateProfile(user.id, {
        personalInformation: { firstName: 'Jane' },
      });

      const { bodyStats } = await profiles.getProfile(user.id);
      expect(bodyStats).toEqual(BODY_STATS);
    });
  });

  describe('username uniqueness', () => {
    it('rejects a taken username with 409, whatever the case', async () => {
      const userName = uniqueUserName();
      const other = await createUser(dataSource);
      await profiles.updateProfile(other.id, {
        personalInformation: { userName },
      });

      for (const taken of [userName, userName.toUpperCase()]) {
        const conflict = await conflictOf(
          profiles.updateProfile(user.id, {
            personalInformation: { userName: taken },
          }),
        );
        expect(conflict?.message).toBe(`Username '${taken}' is already taken.`);
      }
    });

    it('lets a User keep their own username', async () => {
      const userName = uniqueUserName();
      await profiles.updateProfile(user.id, {
        personalInformation: { userName },
      });

      await expect(
        profiles.updateProfile(user.id, {
          personalInformation: { userName, firstName: 'John' },
        }),
      ).resolves.toBeDefined();
    });

    it('allows many Users without a username', async () => {
      const other = await createUser(dataSource);

      await expect(
        profiles.updateProfile(other.id, {
          personalInformation: { firstName: 'No username' },
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('email uniqueness', () => {
    it('rejects a duplicate active email with 409', async () => {
      const conflict = await conflictOf(
        dataSource.getRepository(User).save({ email: user.email }),
      );

      expect(conflict?.message).toBe('Email already in use.');
    });
  });

  describe('deleteAccount', () => {
    it('clears the Profile and avatarKey and soft-deletes the User', async () => {
      const userName = uniqueUserName();
      await profiles.updateProfile(user.id, {
        personalInformation: { userName, firstName: 'John' },
        socialProfiles: { linkedin: 'https://linkedin.com/in/john' },
        bodyStats: {
          sex: ESex.MALE,
          heightCm: 180,
          weightKg: 80.5,
          neckCm: 38,
        },
        notificationSettings: {
          defaultEmailAddress: 'john@example.com',
          marketingEmail: true,
        },
      });
      await dataSource
        .getRepository(User)
        .update(user.id, { avatarKey: '1/a.webp' });

      await profiles.deleteAccount(user.id);

      const deleted = await reload(user.id);
      expect(deleted.deleteTimeStamp).not.toBeNull();
      expect(deleted.avatarKey).toBeNull();
      expect(deleted.personalInformation).toEqual(EMPTY_PERSONAL_INFORMATION);
      expect(deleted.socialProfiles).toEqual(EMPTY_SOCIAL_PROFILES);
      expect(deleted.bodyStats).toEqual(EMPTY_BODY_STATS);
      expect(deleted.notificationSettings).toMatchObject({
        defaultEmailAddress: null,
        marketingEmail: false,
      });
    });

    it("ends every one of the User's Sessions, and only theirs", async () => {
      const other = await createUser(dataSource);
      const sessions = dataSource.getRepository(Session);
      const startSession = (owner: User) =>
        sessions.insert({
          id: randomUUID(),
          user: { id: owner.id },
          refreshTokenHash: createHash('sha256').update('token').digest('hex'),
          expiresAt: new Date('2100-01-01'),
          lastUsedAt: new Date(),
        });
      await startSession(user);
      await startSession(user);
      await startSession(other);

      await profiles.deleteAccount(user.id);

      expect(await sessions.countBy({ user: { id: user.id } })).toBe(0);
      expect(await sessions.countBy({ user: { id: other.id } })).toBe(1);
    });

    it('frees the email and username for a new User', async () => {
      const userName = uniqueUserName();
      await profiles.updateProfile(user.id, {
        personalInformation: { userName },
      });

      await profiles.deleteAccount(user.id);

      const newcomer = await dataSource
        .getRepository(User)
        .save({ email: user.email });
      await expect(
        profiles.updateProfile(newcomer.id, {
          personalInformation: { userName },
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('uploadAvatar', () => {
    it('stores a 512px WebP without EXIF under <userId>/<uuid>.webp', async () => {
      const saved = await upload(user, await png());

      expect(saved.avatarKey).toMatch(
        new RegExp(`^${user.id}/[0-9a-f-]{36}\\.webp$`),
      );
      const stored = files.files.get(saved.avatarKey);
      expect(stored).toMatchObject({
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
      });
      const meta = await sharp(stored.body).metadata();
      expect(meta).toMatchObject({ format: 'webp', width: 512, height: 512 });
      expect(meta.exif).toBeUndefined();
      expect((await reload(user.id)).avatarKey).toBe(saved.avatarKey);
    });

    it('400s without a file, for a disallowed type and for undecodable data', async () => {
      await expect(profiles.uploadAvatar(undefined, user.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(upload(user, await png(), 'image/gif')).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        upload(user, Buffer.from('not an image'), 'image/png'),
      ).rejects.toThrow(BadRequestException);
      expect(files.files.size).toBe(0);
    });

    it('500s with a generic message when the store fails, keeping the old avatar', async () => {
      const first = await upload(user, await png());
      files.failPut = true;

      await expect(upload(user, await png())).rejects.toThrow(
        'Failed to store the avatar',
      );
      expect((await reload(user.id)).avatarKey).toBe(first.avatarKey);
    });

    it('deletes the old object on replace', async () => {
      const first = await upload(user, await png());
      const second = await upload(user, await png());

      expect([...files.files.keys()]).toEqual([second.avatarKey]);
      expect(second.avatarKey).not.toBe(first.avatarKey);
    });

    it('succeeds when deleting the old object fails', async () => {
      await upload(user, await png());
      files.failDelete = true;

      const second = await upload(user, await png());

      expect((await reload(user.id)).avatarKey).toBe(second.avatarKey);
    });

    it('deletes the object on account deletion, even if the delete fails', async () => {
      const { avatarKey } = await upload(user, await png());
      await profiles.deleteAccount(user.id);
      expect(files.files.has(avatarKey)).toBe(false);

      const other = await createUser(dataSource);
      await upload(other, await png());
      files.failDelete = true;
      await expect(profiles.deleteAccount(other.id)).resolves.toBeUndefined();
      expect((await reload(other.id)).deleteTimeStamp).not.toBeNull();
    });
  });
});
