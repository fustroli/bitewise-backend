import * as bcrypt from 'bcrypt';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../../test/int/test-database.js';
import { toConflict } from '../../../common/filters/index.js';
import { config } from '../../../config/index.js';
import { IMailMessage, MailService, MailTransport } from '../../mail/index.js';
import { User } from '../../user/entities/index.js';
import { ProfileService } from '../../user/service/index.js';
import { InMemoryFileStore } from '../../storage/index.js';
import { sha256 } from '../crypto/index.js';
import { EmailVerificationToken, Session } from '../entities/index.js';
import { ETokenPurpose } from '../enum/index.js';
import {
  EMAIL_CHANGE_TTL_MS,
  EmailChangeService,
} from './email-change.service.js';
import { EmailVerificationService } from './email-verification.service.js';
import { PasswordResetService } from './password-reset.service.js';

// expiresAt is stored to the second
const CLOCK_SLACK_MS = 1000;
const PASSWORD = 'Password1!';
// A confirm link and a cancel link
const LINKS_PER_CHANGE = 2;

class RecordingTransport extends MailTransport {
  readonly sent: IMailMessage[] = [];

  async send(message: IMailMessage): Promise<void> {
    this.sent.push(message);
  }
}

describe('EmailChangeService', () => {
  let dataSource: DataSource;
  let users: Repository<User>;
  let tokens: Repository<EmailVerificationToken>;
  let transport: RecordingTransport;
  let emailChange: EmailChangeService;
  let verification: EmailVerificationService;
  let passwordReset: PasswordResetService;
  let profiles: ProfileService;

  const newAddress = () => `${randomUUID()}@example.com`;

  const mailsTo = (email: string) =>
    transport.sent.filter((m) => m.to === email);

  // The token in the link of the last email sent to `email`
  const lastToken = (email: string) => {
    const mail = transport.sent.findLast((m) => m.to === email);
    return new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get(
      'token',
    );
  };

  const createUserWithPassword = async () => {
    const user = await createUser(dataSource);
    await users.update(user.id, {
      hash: await bcrypt.hash(PASSWORD, config.SALT_WORK_FACTOR),
    });
    return reload(user);
  };

  const reload = (user: User) => users.findOneByOrFail({ id: user.id });

  const addSession = async (user: User) => {
    const id = randomUUID();
    await dataSource.getRepository(Session).insert({
      id,
      user: { id: user.id },
      refreshTokenHash: sha256(randomUUID()),
      expiresAt: new Date(Date.now() + EMAIL_CHANGE_TTL_MS),
      lastUsedAt: new Date(),
    });
    return id;
  };

  const sessionIds = async (user: User) =>
    (
      await dataSource.getRepository(Session).findBy({ user: { id: user.id } })
    ).map((s) => s.id);

  // Requests a change to `to`; returns both link tokens
  const requestFor = async (user: User, to = newAddress(), sid?: string) => {
    await emailChange.request(user.id, sid ?? randomUUID(), to, PASSWORD);
    return { to, confirm: lastToken(to), cancel: lastToken(user.email) };
  };

  const expire = (user: User) =>
    tokens.update(
      { user: { id: user.id } },
      { expiresAt: new Date(Date.now() - CLOCK_SLACK_MS) },
    );

  beforeAll(async () => {
    config.FRONTEND_URL = 'http://frontend.test';
    config.MAIL.FROM = 'no-reply@example.com';
    config.SALT_WORK_FACTOR = 4;

    dataSource = await connectTestDatabase(await createTestDatabase());
    users = dataSource.getRepository(User);
    tokens = dataSource.getRepository(EmailVerificationToken);
    transport = new RecordingTransport();
    const mail = new MailService(transport);
    emailChange = new EmailChangeService(users, tokens, mail);
    verification = new EmailVerificationService(users, tokens, mail);
    passwordReset = new PasswordResetService(users, tokens, mail);
    profiles = new ProfileService(users, tokens, new InMemoryFileStore());
  });

  afterAll(() => dataSource.destroy());

  describe('request', () => {
    it('mails a confirm link to the new address and a cancel link to the old one', async () => {
      const user = await createUserWithPassword();

      const { to, confirm, cancel } = await requestFor(user);

      const [toNew] = mailsTo(to);
      expect(toNew.subject).toBe('Confirm your new BiteWise email');
      expect(toNew.html).toContain(
        `http://frontend.test/confirm-email-change?token=${confirm}`,
      );
      const [toOld] = mailsTo(user.email);
      expect(toOld.subject).toBe('Your BiteWise email is about to change');
      expect(toOld.text).toContain(to);
      expect(toOld.html).toContain(
        `http://frontend.test/cancel-email-change?token=${cancel}`,
      );
    });

    it('stores only the hashes, the new address and the Session, valid for 24 hours', async () => {
      const user = await createUserWithPassword();
      const sid = randomUUID();

      const { to, confirm, cancel } = await requestFor(user, undefined, sid);

      const stored = await tokens.findBy({ user: { id: user.id } });
      expect(stored).toHaveLength(LINKS_PER_CHANGE);
      const byPurpose = Object.fromEntries(stored.map((t) => [t.purpose, t]));
      expect(byPurpose[ETokenPurpose.EMAIL_CHANGE]).toMatchObject({
        tokenHash: sha256(confirm),
        newEmail: to,
        sessionId: sid,
      });
      expect(byPurpose[ETokenPurpose.EMAIL_CHANGE_CANCEL]).toMatchObject({
        tokenHash: sha256(cancel),
      });
      for (const token of stored) {
        const ttl = token.expiresAt.getTime() - Date.now();
        expect(Math.abs(ttl - EMAIL_CHANGE_TTL_MS)).toBeLessThan(
          CLOCK_SLACK_MS,
        );
      }
    });

    it('lets an unverified User change', async () => {
      const user = await createUserWithPassword();
      expect(user.emailVerified).toBe(false);

      await expect(requestFor(user)).resolves.toBeDefined();
    });

    it('rejects a Google-only User with 403', async () => {
      const user = await createUser(dataSource);

      await expect(
        emailChange.request(user.id, randomUUID(), newAddress(), PASSWORD),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a wrong password with 401', async () => {
      const user = await createUserWithPassword();

      await expect(
        emailChange.request(user.id, randomUUID(), newAddress(), 'Wrong1!'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mailsTo(user.email)).toHaveLength(0);
    });

    it('rejects the current address with 400', async () => {
      const user = await createUserWithPassword();

      await expect(
        emailChange.request(user.id, randomUUID(), user.email, PASSWORD),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects another User's address with 409", async () => {
      const user = await createUserWithPassword();
      const other = await createUser(dataSource);

      await expect(
        emailChange.request(user.id, randomUUID(), other.email, PASSWORD),
      ).rejects.toThrow(ConflictException);
    });

    it("allows a deleted User's address", async () => {
      const user = await createUserWithPassword();
      const other = await createUser(dataSource);
      await users.softDelete(other.id);

      await expect(requestFor(user, other.email)).resolves.toBeDefined();
    });

    it('replaces a pending change: earlier links are gone', async () => {
      const user = await createUserWithPassword();
      const first = await requestFor(user);

      const second = await requestFor(user);

      expect(await tokens.countBy({ user: { id: user.id } })).toBe(
        LINKS_PER_CHANGE,
      );
      await expect(emailChange.confirm(first.confirm)).rejects.toThrow(
        BadRequestException,
      );
      await expect(emailChange.cancel(first.cancel)).rejects.toThrow(
        BadRequestException,
      );
      await emailChange.confirm(second.confirm);
      expect((await reload(user)).email).toBe(second.to);
    });
  });

  describe('confirm', () => {
    it('swaps the email and verifies it', async () => {
      const user = await createUserWithPassword();
      const { to, confirm } = await requestFor(user);

      await emailChange.confirm(confirm);

      const changed = await reload(user);
      expect(changed.email).toBe(to);
      expect(changed.emailVerified).toBe(true);
    });

    it('ends every Session but the requesting one', async () => {
      const user = await createUserWithPassword();
      const requesting = await addSession(user);
      await addSession(user);
      const { confirm } = await requestFor(user, undefined, requesting);

      await emailChange.confirm(confirm);

      expect(await sessionIds(user)).toEqual([requesting]);
    });

    it('keeps a linked Google identity', async () => {
      const user = await createUserWithPassword();
      await users.update(user.id, { googleId: `google-${randomUUID()}` });
      const { confirm } = await requestFor(user);

      await emailChange.confirm(confirm);

      expect((await reload(user)).googleId).toMatch(/^google-/);
    });

    it('drops pending Email verification and Password reset links', async () => {
      const user = await createUserWithPassword();
      await verification.send(user);
      await passwordReset.request(user.email);
      const { confirm } = await requestFor(user);

      await emailChange.confirm(confirm);

      const purposes = (await tokens.findBy({ user: { id: user.id } }))
        .map((t) => t.purpose)
        .sort();
      expect(purposes).toEqual([
        ETokenPurpose.EMAIL_CHANGE,
        ETokenPurpose.EMAIL_CHANGE_CANCEL,
      ]);
    });

    it('mails a notice to the old address', async () => {
      const user = await createUserWithPassword();
      const { to, confirm } = await requestFor(user);

      await emailChange.confirm(confirm);

      const notice = transport.sent.findLast((m) => m.to === user.email);
      expect(notice.subject).toBe('Your BiteWise email was changed');
      expect(notice.text).toContain(to);
    });

    it('signs in with the new address and frees the old one', async () => {
      const user = await createUserWithPassword();
      const { to, confirm } = await requestFor(user);

      await emailChange.confirm(confirm);

      expect(await users.existsBy({ activeEmail: to })).toBe(true);
      expect(await users.existsBy({ activeEmail: user.email })).toBe(false);
    });

    it('is a 409 when the address was taken in the meantime, and changes nothing', async () => {
      const user = await createUserWithPassword();
      const { to, confirm } = await requestFor(user);
      await users.save({ email: to });

      const error = await emailChange.confirm(confirm).catch((e) => e);

      expect(toConflict(error)).toBeInstanceOf(ConflictException);
      expect((await reload(user)).email).toBe(user.email);
      const stored = await tokens.findOneBy({ tokenHash: sha256(confirm) });
      expect(stored.usedAt).toBeNull();
    });

    it('is a no-op the second time', async () => {
      const user = await createUserWithPassword();
      const { confirm } = await requestFor(user);
      await emailChange.confirm(confirm);
      const sent = transport.sent.length;

      await expect(emailChange.confirm(confirm)).resolves.toBeUndefined();
      expect(transport.sent).toHaveLength(sent);
    });

    it('is a no-op once the change is cancelled', async () => {
      const user = await createUserWithPassword();
      const { confirm, cancel } = await requestFor(user);
      await emailChange.cancel(cancel);

      await emailChange.confirm(confirm);

      expect((await reload(user)).email).toBe(user.email);
    });

    it('is a no-op after an in-app cancel', async () => {
      const user = await createUserWithPassword();
      const { confirm } = await requestFor(user);
      await emailChange.discard(user.id);

      await emailChange.confirm(confirm);

      expect((await reload(user)).email).toBe(user.email);
    });

    it('rejects an expired token with 400', async () => {
      const user = await createUserWithPassword();
      const { confirm } = await requestFor(user);
      await expire(user);

      await expect(emailChange.confirm(confirm)).rejects.toThrow(
        'Invalid or expired email change link',
      );
    });

    it('rejects an unknown token and a cancel token with 400', async () => {
      const user = await createUserWithPassword();
      const { cancel } = await requestFor(user);

      await expect(emailChange.confirm('not-a-token')).rejects.toThrow(
        BadRequestException,
      );
      await expect(emailChange.confirm(cancel)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects links cancelled by a Password reset with 400', async () => {
      const user = await createUserWithPassword();
      const { confirm } = await requestFor(user);
      await passwordReset.request(user.email);
      await passwordReset.confirm(lastToken(user.email), 'NewPassword1!');

      await expect(emailChange.confirm(confirm)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects a deleted User's token with 400", async () => {
      const user = await createUserWithPassword();
      const { confirm } = await requestFor(user);
      await users.softDelete(user.id);

      await expect(emailChange.confirm(confirm)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('clears the pending change and the password, and ends every Session', async () => {
      const user = await createUserWithPassword();
      const requesting = await addSession(user);
      await addSession(user);
      const { cancel } = await requestFor(user, undefined, requesting);

      await emailChange.cancel(cancel);

      const after = await reload(user);
      expect(after.hash).toBeNull();
      expect(after.email).toBe(user.email);
      expect(await sessionIds(user)).toEqual([]);
      expect(await profiles.getPendingEmailChange(user.id)).toBeNull();
    });

    it('is a no-op the second time and once confirmed', async () => {
      const user = await createUserWithPassword();
      const { confirm, cancel } = await requestFor(user);
      await emailChange.confirm(confirm);
      const sessionId = await addSession(user);

      await expect(emailChange.cancel(cancel)).resolves.toBeUndefined();
      expect((await reload(user)).hash).not.toBeNull();
      expect(await sessionIds(user)).toEqual([sessionId]);
    });

    it('rejects an expired token with 400 and changes nothing', async () => {
      const user = await createUserWithPassword();
      const { cancel } = await requestFor(user);
      await expire(user);

      await expect(emailChange.cancel(cancel)).rejects.toThrow(
        BadRequestException,
      );
      expect((await reload(user)).hash).not.toBeNull();
    });

    it('rejects a confirm token with 400', async () => {
      const user = await createUserWithPassword();
      const { confirm } = await requestFor(user);

      await expect(emailChange.cancel(confirm)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('discard', () => {
    it('clears the pending change and ends no Session', async () => {
      const user = await createUserWithPassword();
      const sessionId = await addSession(user);
      await requestFor(user);

      await emailChange.discard(user.id);

      expect(await profiles.getPendingEmailChange(user.id)).toBeNull();
      expect(await sessionIds(user)).toEqual([sessionId]);
      expect((await reload(user)).hash).not.toBeNull();
    });

    it('succeeds without a pending change', async () => {
      const user = await createUserWithPassword();

      await expect(emailChange.discard(user.id)).resolves.toBeUndefined();
    });
  });

  describe('pending Email change on the Profile', () => {
    it('is the new address and expiry while pending', async () => {
      const user = await createUserWithPassword();
      const { to } = await requestFor(user);

      const pending = await profiles.getPendingEmailChange(user.id);

      expect(pending.email).toBe(to);
      const ttl = pending.expiresAt.getTime() - Date.now();
      expect(Math.abs(ttl - EMAIL_CHANGE_TTL_MS)).toBeLessThan(CLOCK_SLACK_MS);
    });

    it('is null once confirmed or expired', async () => {
      const confirmed = await createUserWithPassword();
      await emailChange.confirm((await requestFor(confirmed)).confirm);
      const expired = await createUserWithPassword();
      await requestFor(expired);
      await expire(expired);

      expect(await profiles.getPendingEmailChange(confirmed.id)).toBeNull();
      expect(await profiles.getPendingEmailChange(expired.id)).toBeNull();
    });
  });
});
