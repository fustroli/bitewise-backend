import * as bcrypt from 'bcrypt';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { EntityManager, In, IsNull, Not, Repository } from 'typeorm';

import { config } from '../../../config/index.js';
import {
  emailChangeConfirmTemplate,
  emailChangedTemplate,
  emailChangeRequestedTemplate,
  MailService,
} from '../../mail/index.js';
import { User } from '../../user/entities/index.js';
import { sha256 } from '../crypto/index.js';
import { EmailVerificationToken, Session } from '../entities/index.js';
import { ETokenPurpose } from '../enum/index.js';

// 24 hours, both links
export const EMAIL_CHANGE_TTL_MS = 86_400_000;
const TOKEN_BYTES = 32;

const INVALID_TOKEN = 'Invalid or expired email change link';

const { EMAIL_CHANGE, EMAIL_CHANGE_CANCEL } = ETokenPurpose;
const BOTH = In([EMAIL_CHANGE, EMAIL_CHANGE_CANCEL]);

/**
 * Email change: a confirm link to the new address, a cancel link to the old
 * one, and the swap once confirmed. See **Email change** in CONTEXT.md.
 */
@Injectable()
export class EmailChangeService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private readonly tokens: Repository<EmailVerificationToken>,
    private readonly mail: MailService,
  ) {}

  /**
   * Re-authenticates with the password, then replaces any pending change with
   * a new one and mails both addresses. A Google-only User is a 403.
   */
  async request(
    userId: number,
    sessionId: string,
    newEmail: string,
    password: string,
  ): Promise<void> {
    const user = await this.users.findOneByOrFail({ id: userId });
    if (!user.hash)
      throw new ForbiddenException('Your sign-in email is managed by Google');
    if (!(await bcrypt.compare(password, user.hash)))
      throw new UnauthorizedException('Password is incorrect');
    if (newEmail === user.email)
      throw new BadRequestException('That is already your email');
    // Checked again on confirm, by the unique index
    if (await this.users.existsBy({ activeEmail: newEmail }))
      throw new ConflictException('Email already in use.');

    const confirmToken = randomBytes(TOKEN_BYTES).toString('base64url');
    const cancelToken = randomBytes(TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

    await this.tokens.manager.transaction(async (manager) => {
      await manager.delete(EmailVerificationToken, {
        user: { id: user.id },
        purpose: BOTH,
        usedAt: IsNull(),
      });
      await manager.insert(EmailVerificationToken, [
        {
          user: { id: user.id },
          purpose: EMAIL_CHANGE,
          tokenHash: sha256(confirmToken),
          expiresAt,
          newEmail,
          sessionId,
        },
        {
          user: { id: user.id },
          purpose: EMAIL_CHANGE_CANCEL,
          tokenHash: sha256(cancelToken),
          expiresAt,
        },
      ]);
    });

    const confirmLink = `${config.FRONTEND_URL}/confirm-email-change?token=${confirmToken}`;
    const cancelLink = `${config.FRONTEND_URL}/cancel-email-change?token=${cancelToken}`;
    void this.mail.send(newEmail, emailChangeConfirmTemplate(confirmLink));
    void this.mail.send(
      user.email,
      emailChangeRequestedTemplate(newEmail, cancelLink),
    );
  }

  /**
   * Swaps the sign-in email and verifies it, ends every other Session than
   * the requesting one, drops links mailed to the old address, and mails it a
   * notice. A taken address is a 409 through DuplicateEntryFilter.
   */
  async confirm(token: string): Promise<void> {
    const found = await this.find(token, EMAIL_CHANGE);
    if (!found) return;
    const { user } = found;

    const done = await this.tokens.manager.transaction(async (manager) => {
      if (!(await this.claim(manager, found))) return false;

      await manager.update(User, user.id, {
        email: found.newEmail,
        emailVerified: true,
      });
      await manager.delete(Session, {
        user: { id: user.id },
        ...(found.sessionId ? { id: Not(found.sessionId) } : {}),
      });
      await manager.delete(EmailVerificationToken, {
        user: { id: user.id },
        purpose: In([
          ETokenPurpose.EMAIL_VERIFICATION,
          ETokenPurpose.PASSWORD_RESET,
        ]),
        usedAt: IsNull(),
      });
      return true;
    });

    if (done)
      void this.mail.send(user.email, emailChangedTemplate(found.newEmail));
  }

  /**
   * Cancels the change from the old address. Whoever started it likely has
   * the password, so it is cleared and every Session ends.
   */
  async cancel(token: string): Promise<void> {
    const found = await this.find(token, EMAIL_CHANGE_CANCEL);
    if (!found) return;

    await this.tokens.manager.transaction(async (manager) => {
      if (!(await this.claim(manager, found))) return;

      await manager.update(User, found.user.id, { hash: null });
      await manager.delete(Session, { user: { id: found.user.id } });
    });
  }

  /** In-app cancel: clears the pending change only. */
  async discard(userId: number): Promise<void> {
    await this.tokens.update(
      { user: { id: userId }, purpose: BOTH, usedAt: IsNull() },
      { usedAt: new Date() },
    );
  }

  /**
   * The token's row, or null once its change is done or cancelled (opening a
   * link twice is a no-op). Unknown or expired tokens are a 400.
   */
  private async find(
    token: string,
    purpose: ETokenPurpose,
  ): Promise<EmailVerificationToken | null> {
    const found = await this.tokens.findOne({
      where: { tokenHash: sha256(token), purpose },
      relations: { user: true },
    });
    // A deleted User's relation loads as null (soft-deleted rows are excluded)
    if (!found?.user) throw new BadRequestException(INVALID_TOKEN);
    if (found.usedAt) return null;
    if (found.expiresAt <= new Date())
      throw new BadRequestException(INVALID_TOKEN);
    return found;
  }

  /**
   * Uses up both links of the change; false if a concurrent confirm or cancel
   * got there first. The User row lock serializes the two.
   */
  private async claim(
    manager: EntityManager,
    found: EmailVerificationToken,
  ): Promise<boolean> {
    await manager.findOne(User, {
      where: { id: found.user.id },
      lock: { mode: 'pessimistic_write' },
    });

    const usedAt = new Date();
    const { affected } = await manager.update(
      EmailVerificationToken,
      { id: found.id, usedAt: IsNull() },
      { usedAt },
    );
    if (!affected) return false;

    await manager.update(
      EmailVerificationToken,
      { user: { id: found.user.id }, purpose: BOTH, usedAt: IsNull() },
      { usedAt },
    );
    return true;
  }
}
