import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
const origin = z
  .string()
  .url()
  .refine(
    (value) => new URL(value).origin === value,
    'Use an origin without path or trailing slash',
  );
const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_ORIGIN: origin.default('http://localhost:5173'),
  ADMIN_ORIGIN: origin.default('http://localhost:5174'),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => /^postgres(ql)?:\/\//.test(value))
    .default('postgresql://postgres:postgres@localhost:5432/gdgoc_tasks?schema=public'),
  SESSION_SECRET: z.string().min(16).default('development_insecure_session_secret_12345'),
  COOKIE_SAME_SITE: z.enum(['lax', 'none']).default('lax'),
  SYSTEM_OWNER_EMAIL: z.string().trim().toLowerCase().email().optional(),
  ENABLE_DEV_LOGIN: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:5000/api/v1/auth/google/callback'),
  REDIS_URL: z
    .string()
    .url()
    .refine((value) => /^rediss?:\/\//.test(value))
    .optional(),
  GITHUB_WEBHOOK_SECRET: z.string().min(16).optional(),
  GITHUB_PAT: z.string().optional(),
});

export function parseEnvironment(input: NodeJS.ProcessEnv) {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new Error(
      `Invalid environment variables: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  const value = parsed.data;
  if (value.NODE_ENV === 'production') {
    const missing = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'CLIENT_ORIGIN',
      'ADMIN_ORIGIN',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_CALLBACK_URL',
      'REDIS_URL',
    ].filter((key) => !input[key]);
    if (missing.length) throw new Error(`Production configuration missing: ${missing.join(', ')}`);
    if (value.ENABLE_DEV_LOGIN) throw new Error('Development login must be disabled in production');
    if (value.SESSION_SECRET.length < 32 || value.SESSION_SECRET.startsWith('development_'))
      throw new Error(
        'Production SESSION_SECRET must be a unique random secret of at least 32 characters',
      );
    if (
      [value.CLIENT_ORIGIN, value.ADMIN_ORIGIN, value.GOOGLE_CALLBACK_URL].some(
        (url) => new URL(url).protocol !== 'https:',
      )
    )
      throw new Error('Production application URLs must use HTTPS');
    if (
      value.GITHUB_WEBHOOK_SECRET &&
      (value.GITHUB_WEBHOOK_SECRET.length < 32 ||
        value.GITHUB_WEBHOOK_SECRET.startsWith('development_'))
    )
      throw new Error(
        'Production webhook secret must be a unique random secret of at least 32 characters',
      );
    const databaseUrl = new URL(value.DATABASE_URL);
    if (
      !['require', 'verify-ca', 'verify-full'].includes(
        databaseUrl.searchParams.get('sslmode') ?? '',
      )
    )
      throw new Error('Production DATABASE_URL must require SSL');
    if (new URL(value.REDIS_URL!).protocol !== 'rediss:')
      throw new Error('Production Redis must use TLS (rediss://)');
  }
  return value;
}
export const env = parseEnvironment(process.env);
export const frontendOrigins = [env.CLIENT_ORIGIN, env.ADMIN_ORIGIN];
