import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import webhookRoutes from './routes/webhook.routes';
import docsRoutes from './routes/docs.routes';

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI to execute inline styles/scripts safely
  }),
);

// CORS
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

// Body parsing with rawBody preservation for Webhook HMAC verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// PostgreSQL Session Store setup
const PgStore = pgSession(session);

// Tests that do not exercise persistence need no database. In other environments,
// connection failures must remain visible instead of silently losing sessions.
export const sessionStore =
  env.NODE_ENV === 'test'
    ? new session.MemoryStore()
    : new PgStore({
        conString: env.DATABASE_URL,
        schemaName: new URL(env.DATABASE_URL).searchParams.get('schema') ?? 'public',
        tableName: 'session',
        createTableIfMissing: false, // Prisma migrations own the table.
      });

export async function closeSessionStore() {
  if ('close' in sessionStore) await sessionStore.close();
}

app.use(
  session({
    store: sessionStore,
    secret: env.SESSION_SECRET || 'development_insecure_session_secret_12345',
    resave: false,
    saveUninitialized: false,
    name: 'gdgoc.sid',
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

// API Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/docs', docsRoutes);

// Central Error Handler
app.use(errorHandler);

export default app;
