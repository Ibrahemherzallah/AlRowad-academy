import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(10, 'JWT_ACCESS_SECRET too short'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET too short'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),

  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  WHATSAPP_PROVIDER: z.string().default('stub'),
  WHATSAPP_API_KEY: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),

  // Bunny.net Stream — video hosting with token-signed playback
  BUNNY_STREAM_LIBRARY_ID: z.string().optional(),
  BUNNY_STREAM_API_KEY: z.string().optional(),
  BUNNY_STREAM_CDN_HOST: z.string().optional(), // e.g. vz-xxxx.b-cdn.net
  BUNNY_STREAM_TOKEN_KEY: z.string().optional(), // token authentication key
  BUNNY_SIGNED_URL_TTL: z.coerce.number().default(600), // seconds a play URL is valid

  EMAIL_PROVIDER: z.string().default('stub'),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('no-reply@rawad.academy'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  // `throw` is always recognized by TS as `never`, so `parsed.data` below is
  // correctly narrowed to defined even if node types aren't fully resolved.
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
