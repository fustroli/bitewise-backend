import { BadRequestException } from '@nestjs/common';
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
import { EmailVerificationToken } from '../entities/index.js';
import { ETokenPurpose } from '../enum/index.js';
import {
  EMAIL_VERIFICATION_TTL_MS,
  EmailVerificationService,
} from './email-verification.service.js';

// expiresAt is stored to the second
const CLOCK_SLACK_MS = 1000;
const EXPIRED_COUNT = 3;
const BATCH_SIZE = 2;

class RecordingTransport extends MailTransport {
  readonly sent: IMailMessage[] = [];

  async send(message: IMailMessage): Promise<void> {
    this.sent.push(message);
  }
}

describe('EmailVerificationService', () => {
  let dataSource: DataSource;
  let users: Repository<User>;
  let tokens: Repository<EmailVerificationToken>;
  let transport: RecordingTransport;
  let verification: EmailVerificationService;

  // The token in the link of the last email sent to `user`
  const lastToken = (user: User) => {
    const mail = transport.sent.findLast((m) => m.to === user.email);
    return new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get(
      'token',
    );
  };

  const sendTo = async (user: User) => {
    await verification.send(user);
    return lastToken(user);
  };

  const reload = (user: User) => users.findOneByOrFail({ id: user.id });

  const tokensOf = (user: User) => tokens.findBy({ user: { id: user.id } });

  beforeAll(async () => {
    config.FRONTEND_URL = 'http://frontend.test';
    config.MAIL.FROM = 'no-reply@example.com';

    dataSource = await connectTestDatabase(await createTestDatabase());
    users = dataSource.getRepository(User);
    tokens = dataSource.getRepository(EmailVerificationToken);
    transport = new RecordingTransport();
    verification = new EmailVerificationService(
      users,
      tokens,
      new MailService(transport),
    );
  });

  afterAll(() => dataSource.destroy());

  describe('send', () => {
    it('mails a frontend link and stores only the token hash', async () => {
      const user = await createUser(dataSource);

      const token = await sendTo(user);

      const mail = transport.sent.findLast((m) => m.to === user.email);
      expect(mail).toMatchObject({ to: user.email, from: config.MAIL.FROM });
      expect(mail.html).toContain(
        `http://frontend.test/verify-email?token=${token}`,
      );
      const [stored] = await tokensOf(user);
      expect(stored.tokenHash).toBe(sha256(token));
      expect(stored.tokenHash).not.toBe(token);
    });

    it('expires the token after 24 hours', async () => {
      const user = await createUser(dataSource);

      await sendTo(user);

      const [stored] = await tokensOf(user);
      const ttl = stored.expiresAt.getTime() - Date.now();
      expect(Math.abs(ttl - EMAIL_VERIFICATION_TTL_MS)).toBeLessThan(
        CLOCK_SLACK_MS,
      );
    });

    it("invalidates the User's earlier unused tokens", async () => {
      const user = await createUser(dataSource);
      const first = await sendTo(user);

      const second = await sendTo(user);

      expect(await tokensOf(user)).toHaveLength(1);
      await expect(verification.verify(first)).rejects.toThrow(
        BadRequestException,
      );
      await expect(verification.verify(second)).resolves.toBeUndefined();
    });
  });

  describe('verify', () => {
    it('verifies the User and marks the token used', async () => {
      const user = await createUser(dataSource);
      const token = await sendTo(user);

      await verification.verify(token);

      expect((await reload(user)).emailVerified).toBe(true);
      const [stored] = await tokensOf(user);
      expect(stored.usedAt).toBeInstanceOf(Date);
    });

    it('is a no-op for a used token once the User is verified', async () => {
      const user = await createUser(dataSource);
      const token = await sendTo(user);
      await verification.verify(token);

      await expect(verification.verify(token)).resolves.toBeUndefined();
    });

    it('rejects a used token while the User is unverified', async () => {
      const user = await createUser(dataSource);
      const token = await sendTo(user);
      await verification.verify(token);
      await users.update(user.id, { emailVerified: false });

      await expect(verification.verify(token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an expired token with 400', async () => {
      const user = await createUser(dataSource);
      const token = await sendTo(user);
      await tokens.update(
        { user: { id: user.id } },
        { expiresAt: new Date(Date.now() - CLOCK_SLACK_MS) },
      );

      await expect(verification.verify(token)).rejects.toThrow(
        'Invalid or expired verification link',
      );
      expect((await reload(user)).emailVerified).toBe(false);
    });

    it('rejects an unknown token with 400', async () => {
      await expect(verification.verify('not-a-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects a deleted User's token with 400", async () => {
      const user = await createUser(dataSource);
      const token = await sendTo(user);
      await users.softDelete(user.id);

      await expect(verification.verify(token)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resend', () => {
    it('mails a new link to an unverified User', async () => {
      const user = await createUser(dataSource);
      const first = await sendTo(user);

      await verification.resend(user.id);

      expect(lastToken(user)).not.toBe(first);
    });

    it('is a no-op for a verified User', async () => {
      const user = await createUser(dataSource);
      await verification.verify(await sendTo(user));
      const sent = transport.sent.length;

      await verification.resend(user.id);

      expect(transport.sent).toHaveLength(sent);
      expect(await tokensOf(user)).toHaveLength(1);
    });
  });

  describe('deleteExpired', () => {
    it('deletes expired tokens only, in batches', async () => {
      const user = await createUser(dataSource);
      const fresh = await createUser(dataSource);
      await tokens.clear();
      for (let i = 0; i < EXPIRED_COUNT; i++) {
        await tokens.insert({
          user: { id: user.id },
          purpose: ETokenPurpose.EMAIL_VERIFICATION,
          tokenHash: sha256(`expired-${i}`),
          expiresAt: new Date(Date.now() - CLOCK_SLACK_MS),
        });
      }
      await sendTo(fresh);

      await expect(verification.deleteExpired(BATCH_SIZE)).resolves.toBe(
        EXPIRED_COUNT,
      );
      expect(await tokensOf(user)).toHaveLength(0);
      expect(await tokensOf(fresh)).toHaveLength(1);
    });
  });
});
