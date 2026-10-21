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

let sessionStore: session.Store;
try {
  sessionStore = new PgStore({
    conString: env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true,
  });
} catch (e) {
  console.warn('⚠️ Could not connect to PostgreSQL session store; falling back to in-memory session for dev/test.');
  sessionStore = new session.MemoryStore();
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
