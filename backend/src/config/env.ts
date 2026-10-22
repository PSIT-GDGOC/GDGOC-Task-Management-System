import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => /^postgres(ql)?:\/\//.test(value), 'Must be a PostgreSQL URL')
    .default('postgresql://postgres:postgres@localhost:5432/gdgoc_tasks?schema=public'),
  SESSION_SECRET: z
    .string()
    .min(16, 'SESSION_SECRET must be at least 16 characters long')
    .default('development_insecure_session_secret_12345'),
  SYSTEM_OWNER_EMAIL: z.string().email().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/v1/auth/google/callback'),
  GITHUB_WEBHOOK_SECRET: z.string().default('development_test_webhook_secret_12345'),
  GITHUB_PAT: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${parsedEnv.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
  );
}

export const env = parsedEnv.data;
