import 'dotenv/config';

export const config: IConfig = {
  PORT: +process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  SALT_WORK_FACTOR: +process.env.SALT_WORK_FACTOR,
  NODE_ENV: process.env.NODE_ENV,
  THROTTLER: {
    LIMIT: +process.env.THROTTLER_LIMIT,
    TTL: +process.env.THROTTLER_TTL,
  },
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
  FACEBOOK: {
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_SECRET: process.env.FACEBOOK_SECRET,
    FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,
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
  THROTTLER: {
    LIMIT: number;
    TTL: number;
  };
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
  FACEBOOK: {
    FACEBOOK_CLIENT_ID: string;
    FACEBOOK_SECRET: string;
    FACEBOOK_CALLBACK_URL: string;
  };
  GCP: {
    GCP_PROJECT_ID: string;
    GCP_PRIVATE_KEY_FILE: string;
    GCP_BUCKET_NAME: string;
  };
}
