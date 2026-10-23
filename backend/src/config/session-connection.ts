import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface SessionConnectionConfig {
  connectionString: string;
  max: number;
  connectionTimeoutMillis: number;
  ssl?: { ca: string; rejectUnauthorized: boolean; servername: string };
}

export function sessionConnectionOptions(databaseUrl: string): SessionConnectionConfig {
  const url = new URL(databaseUrl);
  const supabase =
    url.hostname.endsWith('.pooler.supabase.com') ||
    /^db\.[a-z0-9]+\.supabase\.co$/.test(url.hostname);
  const limits = { max: 3, connectionTimeoutMillis: 5000 };
  if (!supabase) return { connectionString: databaseUrl, ...limits };

  // pg replaces an explicit ssl object if SSL options remain in its URL.
  // Trust the provider's public CA while preserving certificate/hostname checks.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl', 'uselibpqcompat'])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ...limits,
    ssl: {
      ca: readFileSync(resolve(__dirname, '../../certs/supabase-ca.crt'), 'utf8'),
      rejectUnauthorized: true,
      servername: url.hostname,
    },
  };
}
