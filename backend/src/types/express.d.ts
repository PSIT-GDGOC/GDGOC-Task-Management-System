import { AuthenticatedUser, AuthSessionUser } from './auth';

declare module 'express-session' {
  interface SessionData {
    user?: AuthSessionUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      rawBody?: Buffer;
    }
  }
}
