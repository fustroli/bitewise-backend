import * as bcrypt from 'bcrypt';

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';

import { config } from '../../../config/index.js';
import {
  MailService,
  passwordChangedTemplate,
  passwordResetTemplate,
} from '../../mail/index.js';
import { User } from '../../user/entities/index.js';
import { sha256 } from '../crypto/index.js';
import { EmailVerificationToken, Session } from '../entities/index.js';
import { ETokenPurpose } from '../enum/index.js';

// 1 hour
export const PASSWORD_RESET_TTL_MS = 3_600_000;
// A User gets at most one reset email per minute
export const PASSWORD_RESET_COOLDOWN_MS = 60_000;
const TOKEN_BYTES = 32;

const INVALID_TOKEN = 'Invalid or expired password reset link';

const purpose = ETokenPurpose.PASSWORD_RESET;

/**
 * Password reset: mails a single-use link to the sign-in email and sets a
 * new password when it's redeemed. See **Password reset** in CONTEXT.md.
 */
@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private readonly tokens: Repository<EmailVerificationToken>,
    private readonly mail: MailService,
  ) {}

  /**
   * Mails a reset link, invalidating the User's earlier unused ones. Silent
   * for an unknown or deleted email (no enumeration), and while a link sent
   * less than a minute ago is still unused.
   */
  async request(email: string): Promise<void> {
    const user = await this.users.findOneBy({ activeEmail: email });
    if (!user) return;

    // expiresAt is set from the app clock, unlike createdAt
    const recent = await this.tokens.existsBy({
      user: { id: user.id },
      purpose,
      usedAt: IsNull(),
      expiresAt: MoreThan(
        new Date(
          Date.now() + PASSWORD_RESET_TTL_MS - PASSWORD_RESET_COOLDOWN_MS,
        ),
      ),
    });
    if (recent) return;

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
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      });
    });

    const link = `${config.FRONTEND_URL}/reset-password?token=${token}`;
    void this.mail.send(user.email, passwordResetTemplate(link));
  }

  /**
   * Sets the new password; an unknown, used or expired token is a 400. The
   * link proves inbox control, so the email becomes verified. Ends every
   * Session and drops every other pending link (a pending Email change may be
   * an attacker's), then mails a notice.
   */
  async confirm(token: string, password: string): Promise<void> {
    const found = await this.tokens.findOne({
      where: { tokenHash: sha256(token), purpose },
      relations: { user: true },
    });
    // A deleted User's relation loads as null (soft-deleted rows are excluded)
    if (!found?.user || found.usedAt || found.expiresAt <= new Date())
      throw new BadRequestException(INVALID_TOKEN);

    const hash = await bcrypt.hash(password, config.SALT_WORK_FACTOR);
    const { user } = found;

    await this.tokens.manager.transaction(async (manager) => {
      // Conditional on usedAt, so two concurrent redemptions can't both win
      const { affected } = await manager.update(
        EmailVerificationToken,
        { id: found.id, usedAt: IsNull() },
        { usedAt: new Date() },
      );
      if (!affected) throw new BadRequestException(INVALID_TOKEN);

      await manager.update(User, user.id, { hash, emailVerified: true });
      await manager.delete(Session, { user: { id: user.id } });
      // Every purpose: verification links are moot, Email changes cancelled
      await manager.delete(EmailVerificationToken, {
        user: { id: user.id },
        usedAt: IsNull(),
      });
    });

    void this.mail.send(user.email, passwordChangedTemplate());
  }
}
