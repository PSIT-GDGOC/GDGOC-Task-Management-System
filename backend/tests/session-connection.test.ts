import { X509Certificate } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sessionConnectionOptions } from '../src/config/session-connection';

describe('PostgreSQL session transport', () => {
  it('verifies Supabase certificates using the official provider CA', () => {
    const options = sessionConnectionOptions(
      'postgresql://postgres.example:fixture@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require&schema=public',
    );
    expect(options.ssl?.rejectUnauthorized).toBe(true);
    expect(options.ssl?.servername).toBe('aws-0-us-west-1.pooler.supabase.com');
    const cert = new X509Certificate(options.ssl!.ca);
    expect(cert.ca).toBe(true);
    expect(cert.fingerprint256).toBe(
      '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA',
    );
    expect(new URL(options.connectionString).searchParams.has('sslmode')).toBe(false);
    expect(new URL(options.connectionString).searchParams.get('schema')).toBe('public');
  });
  it('keeps local connection settings without forcing hosted TLS', () => {
    const url = 'postgresql://postgres@127.0.0.1:5432/postgres?schema=isolated';
    const options = sessionConnectionOptions(url);
    expect(options.connectionString).toBe(url);
    expect(options.ssl).toBeUndefined();
  });
  it('does not trust Supabase CA for a lookalike host', () => {
    const options = sessionConnectionOptions(
      'postgresql://user@db.pooler.supabase.com.example:5432/postgres?sslmode=verify-full',
    );
    expect(options.ssl).toBeUndefined();
    expect(options.connectionString).toContain('sslmode=verify-full');
  });
});
