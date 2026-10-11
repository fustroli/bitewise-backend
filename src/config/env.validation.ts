// Property names are the env var names themselves (and validator.js option names).
/* eslint-disable @typescript-eslint/naming-convention */
import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  registerDecorator,
  validateSync,
  ValidationError,
} from 'class-validator';
import parse from 'parse-duration';

const MIN_SECRET_LENGTH = 32;
const MAX_PORT = 65535;
// bcrypt cost: 10 is the floor for prod; 31 is bcrypt's max
const MIN_SALT_ROUNDS = 10;
const MAX_SALT_ROUNDS = 31;

// A duration parse-duration understands ("15m", "7d"), > 0
function IsDuration() {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isDuration',
      target: target.constructor,
      propertyName,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && (parse(value) ?? 0) > 0,
        defaultMessage: () =>
          `${propertyName} must be a positive duration like "15m" or "7d"`,
      },
    });
}

const url = { require_tld: false, require_protocol: true };

class EnvironmentVariables {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PORT)
  PORT: number;

  @IsUrl(url)
  FRONTEND_URL: string;

  @IsOptional()
  @IsString()
  COOKIE_DOMAIN?: string;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_SALT_ROUNDS)
  @Max(MAX_SALT_ROUNDS)
  SALT_WORK_FACTOR: number;

  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  SWAGGER_ENABLED?: string;

  @IsString()
  @MinLength(MIN_SECRET_LENGTH)
  ACCESS_TOKEN_SECRET: string;

  @IsDuration()
  ACCESS_TOKEN_EXPIRATION: string;

  @IsString()
  @MinLength(MIN_SECRET_LENGTH)
  REFRESH_TOKEN_SECRET: string;

  @IsDuration()
  REFRESH_TOKEN_EXPIRATION: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  THROTTLER_LIMIT: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  THROTTLER_TTL: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  TRUST_PROXY_HOPS?: number;

  @IsString()
  @IsNotEmpty()
  TYPEORM_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PORT)
  TYPEORM_PORT: number;

  @IsString()
  @IsNotEmpty()
  TYPEORM_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  TYPEORM_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  TYPEORM_DATABASE_DEV: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_SECRET: string;

  @IsUrl(url)
  GOOGLE_CALLBACK_URL: string;

  @IsString()
  @IsNotEmpty()
  GCP_PROJECT_ID: string;

  @IsString()
  @IsNotEmpty()
  GCP_PRIVATE_KEY_FILE: string;

  @IsString()
  @IsNotEmpty()
  GCP_BUCKET_NAME: string;
}

/** One message per invalid key; empty when the env is valid. */
export function validateEnv(env: NodeJS.ProcessEnv): string[] {
  // Unset optional keys are absent, not "" (an empty line in .env is "")
  const present = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== ''),
  );
  const instance = plainToInstance(EnvironmentVariables, present);
  return validateSync(instance).map(
    (error: ValidationError) =>
      `${error.property}: ${Object.values(error.constraints ?? {}).join('; ')}`,
  );
}

/** Throws listing every invalid key. Call before anything uses `config`. */
export function assertValidEnv(env: NodeJS.ProcessEnv = process.env): void {
  const errors = validateEnv(env);
  if (errors.length) {
    throw new Error(
      `Invalid environment configuration:\n  - ${errors.join('\n  - ')}`,
    );
  }
}
