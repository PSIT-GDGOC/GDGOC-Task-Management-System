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
  PROCESS_ROLE: z.enum(['web', 'worker']).default('web'),
  WORKER_MODE: z.enum(['embedded', 'external']).default('embedded'),
  REDIS_TRANSPORT: z.enum(['tls', 'render-internal']).default('tls'),
  RENDER: z.string().optional(),
  ALLOW_SELF_REGISTRATION: z.enum(['true', 'false']).optional(),
  REDIS_PREFIX: z
    .string()
    .regex(/^[a-z0-9_-]{1,50}$/)
    .optional(),
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
  GOOGLE_AUTH_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
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
  // Before frontends are hosted, an explicitly disabled Google deployment only
  // accepts its own Render origin. Enabling Google requires explicit app origins.
  const configured = { ...input };
  configured.COOKIE_SAME_SITE ??=
    input.NODE_ENV === 'production' || input.RENDER === 'true' ? 'none' : 'lax';
  if (
    input.NODE_ENV === 'production' &&
    input.GOOGLE_AUTH_ENABLED === 'false' &&
    input.RENDER === 'true' &&
    input.RENDER_EXTERNAL_URL
  ) {
    configured.CLIENT_ORIGIN ??= input.RENDER_EXTERNAL_URL;
    configured.ADMIN_ORIGIN ??= input.RENDER_EXTERNAL_URL;
  }
  const parsed = schema.safeParse(configured);
  if (!parsed.success)
    throw new Error(
      `Invalid environment variables: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  const value = parsed.data;
  if (value.NODE_ENV === 'production') {
    const required =
      value.PROCESS_ROLE === 'worker'
        ? ['DATABASE_URL', 'REDIS_URL']
        : [
            'DATABASE_URL',
            'SESSION_SECRET',
            'CLIENT_ORIGIN',
            'ADMIN_ORIGIN',
            'SYSTEM_OWNER_EMAIL',
            'DIRECT_URL',
            ...(value.GOOGLE_AUTH_ENABLED
              ? ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL']
              : []),
            'REDIS_URL',
          ];
    const missing = required.filter((key) => !configured[key]);
    if (missing.length) throw new Error(`Production configuration missing: ${missing.join(', ')}`);
    if (value.ENABLE_DEV_LOGIN && input.ALLOW_STAGING_DEV_LOGIN !== 'true')
      throw new Error('Development login must be disabled in production');
    if (
      value.PROCESS_ROLE === 'web' &&
      (value.SESSION_SECRET.length < 32 ||
        value.SESSION_SECRET.startsWith('development_') ||
        [
          'super-secret-random-key-at-least-32-chars-long',
          'replace-with-a-secure-random-32-byte-hex-secret',
        ].includes(value.SESSION_SECRET))
    )
      throw new Error(
        'Production SESSION_SECRET must be a unique random secret of at least 32 characters',
      );
    if (
      value.PROCESS_ROLE === 'web' &&
      [
        value.CLIENT_ORIGIN,
        value.ADMIN_ORIGIN,
        ...(value.GOOGLE_AUTH_ENABLED ? [value.GOOGLE_CALLBACK_URL] : []),
      ].some((url) => new URL(url).protocol !== 'https:')
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
    for (const databaseConnection of [value.DATABASE_URL, input.DIRECT_URL].filter(
      (url): url is string => Boolean(url),
    )) {
      const databaseUrl = new URL(databaseConnection);
      if (
        !['require', 'verify-ca', 'verify-full'].includes(
          databaseUrl.searchParams.get('sslmode') ?? '',
        )
      )
        throw new Error('Production database connections must require SSL');
    }
    const redisUrl = new URL(value.REDIS_URL!);
    const privateRender =
      value.REDIS_TRANSPORT === 'render-internal' &&
      value.RENDER === 'true' &&
      redisUrl.protocol === 'redis:' &&
      /^red-[a-z0-9]+$/.test(redisUrl.hostname) &&
      redisUrl.port === '6379';
    if (redisUrl.protocol !== 'rediss:' && !privateRender)
      throw new Error('Production Redis must use TLS (rediss://)');
  }
  return {
    ...value,
    ALLOW_SELF_REGISTRATION:
      value.ALLOW_SELF_REGISTRATION === 'true' ||
      (value.ALLOW_SELF_REGISTRATION === undefined && value.NODE_ENV !== 'production'),
    REDIS_PREFIX: value.REDIS_PREFIX ?? `gdgoc-${value.NODE_ENV}`,
  };
}
export const env = parseEnvironment(process.env);
export const frontendOrigins = [
  env.CLIENT_ORIGIN,
  env.ADMIN_ORIGIN,
  ...(env.ENABLE_DEV_LOGIN ? ['http://localhost:5173', 'http://localhost:5174'] : []),
];

export function isTrustedFrontendOrigin(origin: string) {
  const clean = origin.replace(/\/$/, '');
  return (
    frontendOrigins.some((allowed) => allowed.replace(/\/$/, '') === clean) ||
    /^https:\/\/gdgoc-task-management-system[a-z0-9-]*\.vercel\.app$/.test(clean)
  );
}
