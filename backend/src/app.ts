import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import { sessionStore } from './lib/session-store';
import { apiLimit } from './security/rateLimits';
import { csrfProtection } from './security/csrf';
import { env, frontendOrigins } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import notificationRoutes from './routes/notification.routes';
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
if (env.NODE_ENV === 'production' || process.env.RENDER === 'true') app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }),
);

// CORS
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);
      const cleanOrigin = requestOrigin.replace(/\/$/, '');
      const isAllowed =
        frontendOrigins.some((o) => o.replace(/\/$/, '') === cleanOrigin) ||
        /^https:\/\/gdgoc-task-management-system[a-z0-9-]*\.vercel\.app$/.test(cleanOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, frontendOrigins.includes(cleanOrigin));
      }
    },
    credentials: true,
  }),
);

// Body parsing with rawBody preservation for Webhook HMAC verification
app.use(
  express.json({
    limit: '64kb',
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

app.use(
  session({
    store: sessionStore,
    secret: env.SESSION_SECRET || 'development_insecure_session_secret_12345',
    resave: false,
    saveUninitialized: false,
    name: 'gdgoc.sid',
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production' || process.env.RENDER === 'true' || env.COOKIE_SAME_SITE === 'none',
      sameSite: env.COOKIE_SAME_SITE,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use('/api/v1', apiLimit);
app.use(csrfProtection);
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// API Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth/invitations', invitationRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
if (env.NODE_ENV !== 'production') app.use('/api/v1/docs', docsRoutes);

// Central Error Handler
app.use(errorHandler);

export default app;
