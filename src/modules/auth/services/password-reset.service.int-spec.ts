import * as bcrypt from 'bcrypt';

import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../../test/int/test-database.js';
import { config } from '../../../config/index.js';
import { IMailMessage, MailService, MailTransport } from '../../mail/index.js';
import { User } from '../../user/entities/index.js';
import { sha256 } from '../crypto/index.js';
import { EmailVerificationToken, Session } from '../entities/index.js';
import { ETokenPurpose } from '../enum/index.js';
import { EmailVerificationService } from './email-verification.service.js';
import {
  PASSWORD_RESET_COOLDOWN_MS,
  PASSWORD_RESET_TTL_MS,
  PasswordResetService,
} from './password-reset.service.js';

// expiresAt is stored to the second
const CLOCK_SLACK_MS = 1000;
const NEW_PASSWORD = 'NewPassword1!';

class RecordingTransport extends MailTransport {
  readonly sent: IMailMessage[] = [];

  async send(message: IMailMessage): Promise<void> {
    this.sent.push(message);
  }
}

describe('PasswordResetService', () => {
  let dataSource: DataSource;
  let users: Repository<User>;
  let tokens: Repository<EmailVerificationToken>;
  let transport: RecordingTransport;
  let passwordReset: PasswordResetService;
  let verification: EmailVerificationService;

  const mailsTo = (user: User) =>
    transport.sent.filter((m) => m.to === user.email);

  // The token in the link of the last email sent to `user`
  const lastToken = (user: User) => {
    const mail = transport.sent.findLast((m) => m.to === user.email);
    return new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get(
      'token',
    );
  };

  const requestFor = async (user: User) => {
    await passwordReset.request(user.email);
    return lastToken(user);
  };

  // Moves the User's reset tokens back in time, past the cooldown
  const age = (user: User, ms = PASSWORD_RESET_COOLDOWN_MS + CLOCK_SLACK_MS) =>
    tokens.update(
      { user: { id: user.id }, purpose: ETokenPurpose.PASSWORD_RESET },
      { expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS - ms) },
    );

  const reload = (user: User) => users.findOneByOrFail({ id: user.id });

  const resetTokensOf = (user: User) =>
    tokens.findBy({
      user: { id: user.id },
      purpose: ETokenPurpose.PASSWORD_RESET,
    });

  const addSession = (user: User) =>
    dataSource.getRepository(Session).insert({
      id: randomUUID(),
      user: { id: user.id },
      refreshTokenHash: sha256(randomUUID()),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      lastUsedAt: new Date(),
    });

  const sessionCount = (user: User) =>
    dataSource.getRepository(Session).countBy({ user: { id: user.id } });

  beforeAll(async () => {
    config.FRONTEND_URL = 'http://frontend.test';
    config.MAIL.FROM = 'no-reply@example.com';
    config.SALT_WORK_FACTOR = 4;

    dataSource = await connectTestDatabase(await createTestDatabase());
    users = dataSource.getRepository(User);
    tokens = dataSource.getRepository(EmailVerificationToken);
    transport = new RecordingTransport();
    const mail = new MailService(transport);
    passwordReset = new PasswordResetService(users, tokens, mail);
    verification = new EmailVerificationService(users, tokens, mail);
  });

  afterAll(() => dataSource.destroy());

  describe('request', () => {
    it('mails a frontend link valid for 1 hour and stores only its hash', async () => {
      const user = await createUser(dataSource);

      const token = await requestFor(user);

      const [mail] = mailsTo(user);
      expect(mail).toMatchObject({
        from: config.MAIL.FROM,
        subject: 'Reset your BiteWise password',
      });
      expect(mail.html).toContain(
        `http://frontend.test/reset-password?token=${token}`,
      );
      const [stored] = await resetTokensOf(user);
      expect(stored.tokenHash).toBe(sha256(token));
      const ttl = stored.expiresAt.getTime() - Date.now();
      expect(Math.abs(ttl - PASSWORD_RESET_TTL_MS)).toBeLessThan(
        CLOCK_SLACK_MS,
      );
    });

    it('sends nothing for an unknown email', async () => {
      const sent = transport.sent.length;

      await passwordReset.request(`${randomUUID()}@example.com`);

      expect(transport.sent).toHaveLength(sent);
    });

    it('sends nothing for a deleted User', async () => {
      const user = await createUser(dataSource);
      await users.softDelete(user.id);

      await passwordReset.request(user.email);

      expect(mailsTo(user)).toHaveLength(0);
      expect(await resetTokensOf(user)).toHaveLength(0);
    });

    it('sends nothing while an unused link is less than a minute old', async () => {
      const user = await createUser(dataSource);
      const first = await requestFor(user);

      await passwordReset.request(user.email);

      expect(mailsTo(user)).toHaveLength(1);
      await expect(
        passwordReset.confirm(first, NEW_PASSWORD),
      ).resolves.toBeUndefined();
    });

    it('invalidates earlier unused links after the cooldown', async () => {
      const user = await createUser(dataSource);
      const first = await requestFor(user);
      await age(user);

      const second = await requestFor(user);

      expect(second).not.toBe(first);
      expect(await resetTokensOf(user)).toHaveLength(1);
      await expect(passwordReset.confirm(first, NEW_PASSWORD)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        passwordReset.confirm(second, NEW_PASSWORD),
      ).resolves.toBeUndefined();
    });

    it('leaves Email verification links alone', async () => {
      const user = await createUser(dataSource);
      await verification.send(user);

      await requestFor(user);

      const purposes = (await tokens.findBy({ user: { id: user.id } })).map(
        (t) => t.purpose,
      );
      expect(purposes.sort()).toEqual([
        ETokenPurpose.EMAIL_VERIFICATION,
        ETokenPurpose.PASSWORD_RESET,
      ]);
    });
  });

  describe('confirm', () => {
    it('sets a first password for a User without one', async () => {
      const user = await createUser(dataSource);
      expect(user.hash).toBeFalsy();

      await passwordReset.confirm(await requestFor(user), NEW_PASSWORD);

      const { hash } = await reload(user);
      await expect(bcrypt.compare(NEW_PASSWORD, hash)).resolves.toBe(true);
    });

    it('verifies the email and marks the token used', async () => {
      const user = await createUser(dataSource);

      await passwordReset.confirm(await requestFor(user), NEW_PASSWORD);

      expect((await reload(user)).emailVerified).toBe(true);
      const [stored] = await resetTokensOf(user);
      expect(stored.usedAt).toBeInstanceOf(Date);
    });

    it('ends every Session', async () => {
      const user = await createUser(dataSource);
      await addSession(user);
      await addSession(user);

      await passwordReset.confirm(await requestFor(user), NEW_PASSWORD);

      expect(await sessionCount(user)).toBe(0);
    });

    it("drops the User's other pending links", async () => {
      const user = await createUser(dataSource);
      await verification.send(user);
      const token = await requestFor(user);

      await passwordReset.confirm(token, NEW_PASSWORD);

      const left = await tokens.findBy({ user: { id: user.id } });
      expect(left).toEqual([
        expect.objectContaining({ tokenHash: sha256(token) }),
      ]);
    });

    it('mails a password-changed notice', async () => {
      const user = await createUser(dataSource);

      await passwordReset.confirm(await requestFor(user), NEW_PASSWORD);

      expect(transport.sent.findLast((m) => m.to === user.email).subject).toBe(
        'Your BiteWise password was changed',
      );
    });

    it('rejects a used token with 400', async () => {
      const user = await createUser(dataSource);
      const token = await requestFor(user);
      await passwordReset.confirm(token, NEW_PASSWORD);

      await expect(passwordReset.confirm(token, 'Other1234!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an expired token with 400 and changes nothing', async () => {
      const user = await createUser(dataSource);
      const token = await requestFor(user);
      await age(user, PASSWORD_RESET_TTL_MS + CLOCK_SLACK_MS);

      await expect(passwordReset.confirm(token, NEW_PASSWORD)).rejects.toThrow(
        'Invalid or expired password reset link',
      );
      const { hash, emailVerified } = await reload(user);
      expect(hash).toBeFalsy();
      expect(emailVerified).toBe(false);
    });

    it('rejects an Email verification token with 400', async () => {
      const user = await createUser(dataSource);
      await verification.send(user);
      const token = lastToken(user);

      await expect(passwordReset.confirm(token, NEW_PASSWORD)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an unknown token with 400', async () => {
      await expect(
        passwordReset.confirm('not-a-token', NEW_PASSWORD),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects a deleted User's token with 400", async () => {
      const user = await createUser(dataSource);
      const token = await requestFor(user);
      await users.softDelete(user.id);

      await expect(passwordReset.confirm(token, NEW_PASSWORD)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
