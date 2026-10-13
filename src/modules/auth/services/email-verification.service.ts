import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';

import { config } from '../../../config/index.js';
import { MailService, verifyEmailTemplate } from '../../mail/index.js';
import { User } from '../../user/entities/index.js';
import { sha256 } from '../crypto/index.js';
import { EmailVerificationToken } from '../entities/index.js';
import { ETokenPurpose } from '../enum/index.js';

// 24 hours
export const EMAIL_VERIFICATION_TTL_MS = 86_400_000;
const TOKEN_BYTES = 32;

const INVALID_TOKEN = 'Invalid or expired verification link';

// Rows per DELETE, so one cleanup run never holds locks on the whole table
const EXPIRED_BATCH_SIZE = 1000;

const purpose = ETokenPurpose.EMAIL_VERIFICATION;

/** Email verification: mails single-use link tokens and redeems them. */
@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private readonly tokens: Repository<EmailVerificationToken>,
    private readonly mail: MailService,
  ) {}

  /**
   * Issues a token, invalidating the User's earlier unused ones, and mails
   * the link without waiting for the send.
   */
  async send(user: User): Promise<void> {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');

    await this.tokens.manager.transaction(async (manager) => {
      await manager.delete(EmailVerificationToken, {
        user: { id: user.id },
        purpose,
        usedAt: IsNull(),
      });
      await manager.insert(EmailVerificationToken, {
        user: { id: user.id },
        purpose,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      });
    });

    const link = `${config.FRONTEND_URL}/verify-email?token=${token}`;
    void this.mail.send(user.email, verifyEmailTemplate(link));
  }

  /** Mails a fresh link; a no-op once the User is verified. */
  async resend(userId: number): Promise<void> {
    const user = await this.users.findOneByOrFail({ id: userId });
    if (!user.emailVerified) await this.send(user);
  }

  /**
   * Verifies the token's User. Unknown, expired or used tokens are a 400,
   * except that any of the User's tokens is a no-op once they're verified,
   * so opening the link twice succeeds.
   */
  async verify(token: string): Promise<void> {
    const found = await this.tokens.findOne({
      where: { tokenHash: sha256(token), purpose },
      relations: { user: true },
    });
    // A deleted User's relation loads as null (soft-deleted rows are excluded)
    if (!found?.user) throw new BadRequestException(INVALID_TOKEN);
    if (found.user.emailVerified) return;
    if (found.usedAt || found.expiresAt <= new Date())
      throw new BadRequestException(INVALID_TOKEN);

    await this.tokens.manager.transaction(async (manager) => {
      // Conditional on usedAt, so two concurrent redemptions can't both win
      const { affected } = await manager.update(
        EmailVerificationToken,
        { id: found.id, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      if (!affected) throw new BadRequestException(INVALID_TOKEN);

      await manager.update(User, found.user.id, { emailVerified: true });
      // Other links mailed to this User are dead now
      await manager.delete(EmailVerificationToken, {
        user: { id: found.user.id },
        purpose,
        usedAt: IsNull(),
      });
    });
  }

  /**
   * Deletes every token that expired before now, in batches; returns how
   * many. Idempotent, so concurrent runs on several instances are harmless.
   */
  async deleteExpired(batchSize = EXPIRED_BATCH_SIZE): Promise<number> {
    const now = new Date();
    let deleted = 0;

    for (;;) {
      const { affectedRows } = await this.tokens.query<{
        affectedRows: number;
      }>(
        'DELETE FROM `email_verification_token` WHERE `expiresAt` < ? LIMIT ?',
        [now, batchSize],
      );
      deleted += affectedRows;
      if (affectedRows < batchSize) return deleted;
    }
  }
}
