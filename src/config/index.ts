import 'dotenv/config';

export { assertValidEnv, validateEnv } from './env.validation.js';

/** SWAGGER_ENABLED when set; otherwise on everywhere but production. */
export function isSwaggerEnabled(env: NodeJS.ProcessEnv): boolean {
  return env.SWAGGER_ENABLED
    ? env.SWAGGER_ENABLED === 'true'
    : env.NODE_ENV !== 'production';
}

export const config: IConfig = {
  PORT: +process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  SALT_WORK_FACTOR: +process.env.SALT_WORK_FACTOR,
  NODE_ENV: process.env.NODE_ENV,
  SWAGGER_ENABLED: isSwaggerEnabled(process.env),
  JWT: {
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION,
  },
  THROTTLER: {
    LIMIT: +process.env.THROTTLER_LIMIT,
    TTL: +process.env.THROTTLER_TTL,
  },
  TRUST_PROXY_HOPS: +(process.env.TRUST_PROXY_HOPS ?? 0),
  TYPEORM: {
    HOST: process.env.TYPEORM_HOST,
    PORT: +process.env.TYPEORM_PORT,
    USERNAME: process.env.TYPEORM_USERNAME,
    PASSWORD: process.env.TYPEORM_PASSWORD,
    DATABASE_DEV: process.env.TYPEORM_DATABASE_DEV,
  },
  MYSQL: {
    ROOT_PASSWORD: process.env.MYSQL_ROOT_PASSWORD,
    DATABASE: process.env.MYSQL_DATABASE,
    USER: process.env.MYSQL_USER,
  },
  GOOGLE: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  },
  GCP: {
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GCP_PRIVATE_KEY_FILE: process.env.GCP_PRIVATE_KEY_FILE,
    GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME,
  },
};

export interface IConfig {
  PORT: number;
  FRONTEND_URL: string;
  COOKIE_DOMAIN?: string;
  SALT_WORK_FACTOR: number;
  NODE_ENV: string;
  // Serve /api/docs and the OpenAPI JSON; off in production unless opted in
  SWAGGER_ENABLED: boolean;
  JWT: {
    ACCESS_TOKEN_SECRET: string;
    // Durations like "1h" / "7d" (ms / parse-duration format)
    ACCESS_TOKEN_EXPIRATION: string;
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRATION: string;
  };
  THROTTLER: {
    LIMIT: number;
    TTL: number;
  };
  // Reverse proxies in front of the app (prod: CloudFront + nginx = 2); 0 = none
  TRUST_PROXY_HOPS: number;
  TYPEORM: {
    HOST: string;
    PORT: number;
    USERNAME: string;
    PASSWORD: string;
    DATABASE_DEV: string;
  };
  MYSQL: {
    ROOT_PASSWORD: string;
    DATABASE: string;
    USER: string;
  };
  GOOGLE: {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_SECRET: string;
    GOOGLE_CALLBACK_URL: string;
  };
  GCP: {
    GCP_PROJECT_ID: string;
    GCP_PRIVATE_KEY_FILE: string;
    GCP_BUCKET_NAME: string;
  };
}
