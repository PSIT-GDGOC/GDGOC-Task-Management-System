import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { csrfProtection } from './security/csrf';
import { env, frontendOrigins } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import invitationRoutes from './routes/invitation.routes';
import historyRoutes from './routes/history.routes';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import webhookRoutes from './routes/webhook.routes';
import docsRoutes from './routes/docs.routes';
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';

const app = express();
if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }),
);

// CORS
app.use(
  cors({
    origin: frontendOrigins,
    credentials: true,
  }),
);

// Body parsing with rawBody preservation for Webhook HMAC verification
app.use(
  express.json({
    limit: '64kb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

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
      sameSite: env.COOKIE_SAME_SITE,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use(csrfProtection);
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// API Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth/invitations', invitationRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/docs', docsRoutes);

// Central Error Handler
app.use(errorHandler);

export default app;
