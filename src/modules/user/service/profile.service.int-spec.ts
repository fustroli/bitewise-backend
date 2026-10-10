import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../../test/int/test-database.js';
import { toConflict } from '../../../common/filters/index.js';
import { StorageService } from '../../storage/storage.service.js';
import { User } from '../entities/index.js';
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

describe('ProfileService', () => {
  let dataSource: DataSource;
  let profiles: ProfileService;
  let user: User;

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
    profiles = new ProfileService(
      dataSource.getRepository(User),
      {} as StorageService,
    );
  });

  afterAll(() => dataSource.destroy());

  beforeEach(async () => {
    user = await createUser(dataSource);
  });

  describe('getProfile', () => {
    it('returns every Profile group, defaulted for a new User', async () => {
      const profile = await profiles.getProfile(user.id);

      expect(profile.personalInformation).toEqual(EMPTY_PERSONAL_INFORMATION);
      expect(profile.socialProfiles).toEqual(EMPTY_SOCIAL_PROFILES);
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
    it('clears the Profile and avatarUrl and soft-deletes the User', async () => {
      const userName = uniqueUserName();
      await profiles.updateProfile(user.id, {
        personalInformation: { userName, firstName: 'John' },
        socialProfiles: { linkedin: 'https://linkedin.com/in/john' },
        notificationSettings: {
          defaultEmailAddress: 'john@example.com',
          marketingEmail: true,
        },
      });
      await dataSource
        .getRepository(User)
        .update(user.id, { avatarUrl: 'https://cdn/avatar.png' });

      await profiles.deleteAccount(user.id);

      const deleted = await reload(user.id);
      expect(deleted.deleteTimeStamp).not.toBeNull();
      expect(deleted.avatarUrl).toBeNull();
      expect(deleted.personalInformation).toEqual(EMPTY_PERSONAL_INFORMATION);
      expect(deleted.socialProfiles).toEqual(EMPTY_SOCIAL_PROFILES);
      expect(deleted.notificationSettings).toMatchObject({
        defaultEmailAddress: null,
        marketingEmail: false,
      });
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
});
