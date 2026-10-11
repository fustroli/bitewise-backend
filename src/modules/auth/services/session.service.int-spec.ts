import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  connectTestDatabase,
  createTestDatabase,
} from '../../../../test/int/test-database.js';
import { toConflict } from '../../../common/filters/index.js';
import { config } from '../../../config/index.js';
import { User } from '../../user/entities/index.js';
import { Session } from '../entities/index.js';
import { IJwtClaims, ISocialProfile } from '../interfaces/index.js';
import { ISessionTokens, SessionService } from './session.service.js';

const PASSWORD = 'StrongPassword1!';
const NEW_PASSWORD = 'NewPassword1!';

describe('SessionService', () => {
  let dataSource: DataSource;
  let sessions: SessionService;
  const jwt = new JwtService();

  const signUp = (email = `${randomUUID()}@example.com`) =>
    sessions.signUp({ email, password: PASSWORD, confirmPassword: PASSWORD });

  const claimsOf = (token: string) => jwt.decode<IJwtClaims>(token);

  // What JwtStrategy does once passport-jwt has verified the access token
  const authenticate = (tokens: ISessionTokens) =>
    sessions.authenticate(claimsOf(tokens.accessToken));

  const sessionCount = (user: User) =>
    dataSource.getRepository(Session).countBy({ user: { id: user.id } });

  beforeAll(async () => {
    // Low bcrypt cost; real JWT signing with test secrets
    config.SALT_WORK_FACTOR = 4;
    config.JWT.ACCESS_TOKEN_SECRET = 'access-secret';
    config.JWT.ACCESS_TOKEN_EXPIRATION = '15m';
    config.JWT.REFRESH_TOKEN_SECRET = 'refresh-secret';
    config.JWT.REFRESH_TOKEN_EXPIRATION = '7d';

    dataSource = await connectTestDatabase(await createTestDatabase());
    sessions = new SessionService(
      dataSource.getRepository(User),
      dataSource.getRepository(Session),
      jwt,
    );
  });

  afterAll(() => dataSource.destroy());

  describe('signUp', () => {
    it('creates the User and starts a Session', async () => {
      const { user, tokens } = await signUp();

      expect(user.id).toBeDefined();
      expect(user.hash).not.toBe(PASSWORD);
      await expect(authenticate(tokens)).resolves.toEqual({
        userId: user.id,
        sessionId: claimsOf(tokens.accessToken).sid,
      });
    });

    it('rejects a taken email with 409', async () => {
      const { user } = await signUp();

      const conflict = await signUp(user.email).then(
        () => null,
        (error) => toConflict(error),
      );

      expect(conflict?.message).toBe('Email already in use.');
    });

    it("accepts a deleted User's email", async () => {
      const { user } = await signUp();
      await dataSource.getRepository(User).softDelete(user.id);

      await expect(signUp(user.email)).resolves.toBeDefined();
    });
  });

  describe('signIn', () => {
    it('starts a new Session alongside existing ones', async () => {
      const { user, tokens: first } = await signUp();

      const { tokens: second } = await sessions.signIn({
        email: user.email,
        password: PASSWORD,
      });

      expect(claimsOf(second.accessToken).sid).not.toBe(
        claimsOf(first.accessToken).sid,
      );
      await expect(authenticate(first)).resolves.toBeDefined();
      await expect(authenticate(second)).resolves.toBeDefined();
    });

    it('rejects a wrong password and an unknown email with the same 401', async () => {
      const { user } = await signUp();

      await expect(
        sessions.signIn({ email: user.email, password: 'nope' }),
      ).rejects.toThrow('Invalid email or password');
      await expect(
        sessions.signIn({
          email: `${randomUUID()}@example.com`,
          password: PASSWORD,
        }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('rejects a deleted User with 401', async () => {
      const { user } = await signUp();
      await dataSource.getRepository(User).softDelete(user.id);

      await expect(
        sessions.signIn({ email: user.email, password: PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("deletes the User's expired Sessions", async () => {
      const { user } = await signUp();
      await dataSource
        .getRepository(Session)
        .update({ user: { id: user.id } }, { expiresAt: new Date(0) });

      await sessions.signIn({ email: user.email, password: PASSWORD });

      expect(await sessionCount(user)).toBe(1);
    });
  });

  describe('rotate', () => {
    it('issues a new pair for the same Session', async () => {
      const { user, tokens } = await signUp();

      const rotated = await sessions.rotate(tokens.refreshToken);

      expect(rotated.user.id).toBe(user.id);
      expect(rotated.tokens.refreshToken).not.toBe(tokens.refreshToken);
      expect(claimsOf(rotated.tokens.accessToken).sid).toBe(
        claimsOf(tokens.accessToken).sid,
      );
      await expect(
        sessions.rotate(rotated.tokens.refreshToken),
      ).resolves.toBeDefined();
    });

    it('ends the Session when a rotated-away token is reused', async () => {
      const { tokens } = await signUp();
      const rotated = await sessions.rotate(tokens.refreshToken);

      await expect(sessions.rotate(tokens.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(
        sessions.rotate(rotated.tokens.refreshToken),
      ).rejects.toThrow(UnauthorizedException);
      await expect(authenticate(rotated.tokens)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("leaves the User's other Sessions alone on reuse", async () => {
      const { user, tokens } = await signUp();
      const other = await sessions.signIn({
        email: user.email,
        password: PASSWORD,
      });
      await sessions.rotate(tokens.refreshToken);

      await expect(sessions.rotate(tokens.refreshToken)).rejects.toThrow();

      await expect(authenticate(other.tokens)).resolves.toBeDefined();
    });

    it('rejects an access token, a forged token and garbage with 401', async () => {
      const { tokens } = await signUp();
      const forged = await jwt.signAsync(claimsOf(tokens.refreshToken), {
        secret: 'not-the-secret',
      });

      for (const token of [tokens.accessToken, forged, 'garbage'])
        await expect(sessions.rotate(token)).rejects.toThrow(
          UnauthorizedException,
        );
    });

    it('rejects an expired Session', async () => {
      const { user, tokens } = await signUp();
      await dataSource
        .getRepository(Session)
        .update({ user: { id: user.id } }, { expiresAt: new Date(0) });

      await expect(sessions.rotate(tokens.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(await sessionCount(user)).toBe(0);
    });
  });

  describe('signOut', () => {
    it('ends the Session, killing its access token, and only that one', async () => {
      const { user, tokens } = await signUp();
      const other = await sessions.signIn({
        email: user.email,
        password: PASSWORD,
      });

      const { sid } = await sessions.verifyRefreshToken(tokens.refreshToken);
      await sessions.signOut(sid);

      await expect(authenticate(tokens)).rejects.toThrow(UnauthorizedException);
      await expect(sessions.rotate(tokens.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authenticate(other.tokens)).resolves.toBeDefined();
    });
  });

  describe('changePassword', () => {
    const change = (oldPassword: string) => ({
      oldPassword,
      password: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    });

    it('changes the password and ends only the other Sessions', async () => {
      const { user, tokens: current } = await signUp();
      const other = await sessions.signIn({
        email: user.email,
        password: PASSWORD,
      });

      await sessions.changePassword(
        user.id,
        claimsOf(current.accessToken).sid,
        change(PASSWORD),
      );

      await expect(authenticate(current)).resolves.toBeDefined();
      await expect(authenticate(other.tokens)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(
        sessions.signIn({ email: user.email, password: NEW_PASSWORD }),
      ).resolves.toBeDefined();
      await expect(
        sessions.signIn({ email: user.email, password: PASSWORD }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong old password with 401 and changes nothing', async () => {
      const { user, tokens } = await signUp();

      await expect(
        sessions.changePassword(
          user.id,
          claimsOf(tokens.accessToken).sid,
          change('wrong'),
        ),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        sessions.signIn({ email: user.email, password: PASSWORD }),
      ).resolves.toBeDefined();
    });
  });

  describe('signInSocial', () => {
    const google = (
      email: string,
      overrides: Partial<ISocialProfile> = {},
    ): ISocialProfile => ({
      provider: 'google',
      providerId: randomUUID(),
      email,
      emailVerified: true,
      ...overrides,
    });

    it('creates a new User for an unknown identity and email', async () => {
      const profile = google(`${randomUUID()}@example.com`);

      const { user, tokens } = await sessions.signInSocial(profile);

      expect(user).toMatchObject({
        email: profile.email,
        googleId: profile.providerId,
      });
      await expect(authenticate(tokens)).resolves.toBeDefined();
    });

    it('signs a known identity in to the same User', async () => {
      const profile = google(`${randomUUID()}@example.com`);
      const { user } = await sessions.signInSocial(profile);

      const again = await sessions.signInSocial(profile);

      expect(again.user.id).toBe(user.id);
    });

    it('links a verified email to the existing User', async () => {
      const { user } = await signUp();

      const linked = await sessions.signInSocial(google(user.email));

      expect(linked.user.id).toBe(user.id);
      expect(linked.user.googleId).toBeDefined();
      await expect(
        sessions.signIn({ email: user.email, password: PASSWORD }),
      ).resolves.toBeDefined();
    });

    it('rejects an unverified email that belongs to another User with 409', async () => {
      const { user } = await signUp();

      await expect(
        sessions.signInSocial(google(user.email, { emailVerified: false })),
      ).rejects.toThrow(ConflictException);
      expect(
        await dataSource.getRepository(User).findOneBy({ id: user.id }),
      ).toMatchObject({ googleId: null });
    });

    it("creates a new User for a deleted User's identity", async () => {
      const profile = google(`${randomUUID()}@example.com`);
      const { user } = await sessions.signInSocial(profile);
      await dataSource.getRepository(User).softDelete(user.id);

      const again = await sessions.signInSocial(profile);

      expect(again.user.id).not.toBe(user.id);
      expect(again.user.googleId).toBe(profile.providerId);
    });

    it('rejects a second User with the same identity with 409', async () => {
      const profile = google(`${randomUUID()}@example.com`);
      await sessions.signInSocial(profile);
      const users = dataSource.getRepository(User);

      const conflict = await users
        .save(
          users.create({
            email: `${randomUUID()}@example.com`,
            googleId: profile.providerId,
          }),
        )
        .then(
          () => null,
          (error) => toConflict(error),
        );

      expect(conflict?.message).toBe(
        'This Google account is already linked to another user.',
      );
    });

    it('creates a User for an unverified email nobody has', async () => {
      const profile = google(`${randomUUID()}@example.com`, {
        emailVerified: false,
      });

      await expect(sessions.signInSocial(profile)).resolves.toMatchObject({
        user: { email: profile.email },
      });
    });
  });

  describe('deleteExpired', () => {
    it('deletes expired Sessions in batches and keeps live ones', async () => {
      const EXPIRED_SESSIONS = 5;
      const BATCH_SIZE = 2;
      const { user: expired } = await signUp();
      for (let i = 1; i < EXPIRED_SESSIONS; i++)
        await sessions.signIn({ email: expired.email, password: PASSWORD });
      await dataSource
        .getRepository(Session)
        .update({ user: { id: expired.id } }, { expiresAt: new Date(0) });
      const { user: live, tokens } = await signUp();

      // Other tests' expired Sessions may be deleted too
      await expect(
        sessions.deleteExpired(BATCH_SIZE),
      ).resolves.toBeGreaterThanOrEqual(EXPIRED_SESSIONS);

      expect(await sessionCount(expired)).toBe(0);
      expect(await sessionCount(live)).toBe(1);
      await expect(authenticate(tokens)).resolves.toBeDefined();
    });

    it('is a no-op when nothing has expired', async () => {
      await sessions.deleteExpired();

      await expect(sessions.deleteExpired()).resolves.toBe(0);
    });
  });

  describe('authenticate', () => {
    it('rejects a deleted User with 401', async () => {
      const { user, tokens } = await signUp();
      await dataSource.getRepository(User).softDelete(user.id);

      await expect(authenticate(tokens)).rejects.toThrow(UnauthorizedException);
      await expect(sessions.rotate(tokens.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a Session id claimed for another User', async () => {
      const { tokens } = await signUp();
      const { user: other } = await signUp();

      await expect(
        sessions.authenticate({
          sub: other.id,
          sid: claimsOf(tokens.accessToken).sid,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
