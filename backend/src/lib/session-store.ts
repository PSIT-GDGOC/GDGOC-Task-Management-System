import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { env } from '../config/env';
import { sessionConnectionOptions } from '../config/session-connection';

const PgStore = pgSession(session);
export const sessionStore =
  env.NODE_ENV === 'test'
    ? new session.MemoryStore()
    : new PgStore({
        conObject: sessionConnectionOptions(env.DATABASE_URL),
        schemaName: new URL(env.DATABASE_URL).searchParams.get('schema') ?? 'public',
        tableName: 'session',
        createTableIfMissing: false,
      });

export function checkSessionStore() {
  return new Promise<void>((resolve, reject) => {
    sessionStore.get('__gdgoc_readiness__', (error) => (error ? reject(error) : resolve()));
  });
}

export async function closeSessionStore() {
  if ('close' in sessionStore) await sessionStore.close();
}
