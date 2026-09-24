import * as bcrypt from 'bcrypt';

import { CookieOptions, Response } from 'express';
import { HttpStatus, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { EExpirationStrategy } from '../../token/enum/index.js';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { User } from '../../user/entities/index.js';
import { UserService } from '../../user/service/index.js';
import { config } from '../../../config/index.js';
import parse from 'parse-duration';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TokenService {
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
  ) {
    this.accessTokenExpiration = this.config.get('ACCESS_TOKEN_EXPIRATION');
    this.refreshTokenExpiration = this.config.get('REFRESH_TOKEN_EXPIRATION');
  }

  async getTokens(
    id: number,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email, sub: id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.accessTokenExpiration as StringValue,
        secret: this.config.get('ACCESS_TOKEN_SECRET'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.refreshTokenExpiration as StringValue,
        secret: this.config.get('REFRESH_TOKEN_SECRET'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async hashString(password: string): Promise<string> {
    return await bcrypt.hash(password, config.SALT_WORK_FACTOR);
  }

  returnTokensAsCookies(
    accessToken: string,
    refreshToken: string,
    res: Response,
    user: User,
    expirationStrategy: EExpirationStrategy = EExpirationStrategy.DEFAULT,
  ) {
    this.setTokensAsCookies(accessToken, refreshToken, res, expirationStrategy);

    return this.sendResponse(res, user);
  }

  public setTokensAsCookies(
    accessToken: string,
    refreshToken: string,
    res: Response,
    expirationStrategy: EExpirationStrategy = EExpirationStrategy.DEFAULT,
  ) {
    const cookieOptions = this.getDefaultCookieOptions();
    const { accessExpiration, refreshExpiration } =
      this.calculateExpirationTimes(expirationStrategy);

    this.setCookie(res, 'accessToken', accessToken, {
      ...cookieOptions,
      expires: new Date(accessExpiration),
    });

    this.setCookie(res, 'refreshToken', refreshToken, {
      ...cookieOptions,
      expires: new Date(refreshExpiration),
    });
  }

  private getDefaultCookieOptions(): CookieOptions {
    return {
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: true,
      path: '/',
      ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
    };
  }

  private calculateExpirationTimes(expirationStrategy: EExpirationStrategy): {
    accessExpiration: number;
    refreshExpiration: number;
  } {
    const now = Date.now();

    let accessExpiration = now + parse(this.accessTokenExpiration);
    let refreshExpiration = now + parse(this.refreshTokenExpiration);

    if (expirationStrategy === EExpirationStrategy.IMMEDIATE) {
      accessExpiration = refreshExpiration = now;
    }

    return { accessExpiration, refreshExpiration };
  }

  private setCookie(
    res: Response,
    name: string,
    value: string,
    options: CookieOptions,
  ) {
    res.cookie(name, value, options);
  }

  private sendResponse(res: Response, user: User): Response {
    const result = plainToInstance(User, user);
    return res.status(HttpStatus.OK).json(result);
  }

  async updateRefreshTokenHash(
    id: number,
    refreshToken: string,
  ): Promise<void> {
    const hash = await this.hashString(refreshToken);

    await this.userService.update(id, { refreshToken: hash });
  }
}
