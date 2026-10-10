import * as bcrypt from 'bcrypt';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';

import {
  ChangePasswordDto,
  CreateUserDto,
  LoginUserDto,
} from '../dto/index.js';
import { CreateSocialUserDto } from '../../user/dto/index.js';
import { IJwtClaims } from '../interfaces/index.js';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Session } from '../entities/index.js';
import type { StringValue } from 'ms';
import { User } from '../../user/entities/index.js';
import { config } from '../../../config/index.js';
import parse from 'parse-duration';

export interface ISessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ISessionResult {
  user: User;
  tokens: ISessionTokens;
}

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_REFRESH_TOKEN = 'Invalid refresh token';

/**
 * The Session lifecycle: starts Sessions (sign-up, sign-in), rotates their
 * refresh tokens, ends them, and authenticates access tokens against them.
 * Owns the User's credential fields; transport (cookies) is the caller's job.
 */
@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Session)
    private readonly sessions: Repository<Session>,
    private readonly jwt: JwtService,
  ) {}

  async signUp(dto: CreateUserDto): Promise<ISessionResult> {
    if (await this.users.existsBy({ email: dto.email }))
      throw new ConflictException('Email already in use');

    const user = await this.users.save(
      this.users.create({
        email: dto.email,
        hash: await bcrypt.hash(dto.password, config.SALT_WORK_FACTOR),
      }),
    );

    return { user, tokens: await this.start(user) };
  }

  async signIn(dto: LoginUserDto): Promise<ISessionResult> {
    const user = await this.users.findOneBy({ email: dto.email });

    const matches =
      !!user?.hash && (await bcrypt.compare(dto.password, user.hash));
    if (!matches) throw new UnauthorizedException(INVALID_CREDENTIALS);

    return { user, tokens: await this.start(user) };
  }

  // Interim: link-by-email as before; reworked into signInSocial(provider, profile)
  async signInSocial(socialUser: CreateSocialUserDto): Promise<ISessionResult> {
    const existing = await this.users.findOneBy({ email: socialUser.email });
    const user = await this.users.save(
      Object.assign(existing ?? this.users.create(), {
        email: socialUser.email,
        googleId: socialUser.googleId ?? existing?.googleId,
      }),
    );

    return { user, tokens: await this.start(user) };
  }

  /**
   * Exchanges a refresh token for a new pair. A token that verifies but is not
   * the Session's current one has been rotated away: the Session is ended.
   */
  async rotate(refreshToken: string): Promise<ISessionResult> {
    const claims = await this.verifyRefreshToken(refreshToken);
    const session = await this.findActive(claims);
    if (!session) throw new UnauthorizedException(INVALID_REFRESH_TOKEN);

    if (session.expiresAt <= new Date() || !matches(refreshToken, session)) {
      await this.sessions.delete(session.id);
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    const tokens = await this.issueTokens(session.user, session.id);
    // Conditional on the old hash, so two concurrent rotations can't both win
    const { affected } = await this.sessions.update(
      { id: session.id, refreshTokenHash: session.refreshTokenHash },
      {
        refreshTokenHash: sha256(tokens.refreshToken),
        expiresAt: refreshExpiry(),
        lastUsedAt: new Date(),
      },
    );
    if (!affected) {
      await this.sessions.delete(session.id);
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    return { user: session.user, tokens };
  }

  async signOut(sid: string): Promise<void> {
    await this.sessions.delete(sid);
  }

  /** Changes the password and ends every other Session of the User. */
  async changePassword(
    userId: number,
    sid: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.users.findOneBy({ id: userId });

    const matches =
      !!user?.hash && (await bcrypt.compare(dto.oldPassword, user.hash));
    if (!matches) throw new UnauthorizedException('Old password is incorrect');

    await this.users.update(user.id, {
      hash: await bcrypt.hash(dto.password, config.SALT_WORK_FACTOR),
    });
    await this.sessions.delete({ user: { id: user.id }, id: Not(sid) });
  }

  /**
   * The User behind a verified access token's claims, or 401 if its Session
   * has ended or the User is gone.
   */
  async authenticate(claims: IJwtClaims): Promise<User> {
    const session = await this.findActive(claims);
    if (!session) throw new UnauthorizedException();
    return session.user;
  }

  /** Verifies a refresh token's signature and expiry; 401 otherwise. */
  async verifyRefreshToken(refreshToken: string): Promise<IJwtClaims> {
    try {
      return await this.jwt.verifyAsync<IJwtClaims>(refreshToken, {
        secret: config.JWT.REFRESH_TOKEN_SECRET,
      });
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }
  }

  private async start(user: User): Promise<ISessionTokens> {
    // Sign-in is where a User's expired Sessions get cleaned up
    await this.sessions.delete({
      user: { id: user.id },
      expiresAt: LessThan(new Date()),
    });

    const id = randomUUID();
    const tokens = await this.issueTokens(user, id);
    await this.sessions.insert({
      id,
      user: { id: user.id },
      refreshTokenHash: sha256(tokens.refreshToken),
      expiresAt: refreshExpiry(),
      lastUsedAt: new Date(),
    });

    return tokens;
  }

  private findActive({ sub, sid }: IJwtClaims): Promise<Session | null> {
    return this.sessions.findOne({
      where: { id: sid, user: { id: sub, deleteTimeStamp: IsNull() } },
      relations: { user: true },
    });
  }

  private async issueTokens(user: User, sid: string): Promise<ISessionTokens> {
    const claims = { sub: user.id, sid };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(claims, {
        secret: config.JWT.ACCESS_TOKEN_SECRET,
        expiresIn: config.JWT.ACCESS_TOKEN_EXPIRATION as StringValue,
      }),
      // jti: two rotations within the same second must still differ
      this.jwt.signAsync(
        { ...claims, jti: randomUUID() },
        {
          secret: config.JWT.REFRESH_TOKEN_SECRET,
          expiresIn: config.JWT.REFRESH_TOKEN_EXPIRATION as StringValue,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}

function sha256(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function matches(refreshToken: string, session: Session): boolean {
  return timingSafeEqual(
    Buffer.from(sha256(refreshToken), 'hex'),
    Buffer.from(session.refreshTokenHash, 'hex'),
  );
}

function refreshExpiry(): Date {
  return new Date(Date.now() + parse(config.JWT.REFRESH_TOKEN_EXPIRATION));
}
