import { AuthenticatedUser, AuthSessionUser } from './auth';

declare module 'express-session' {
  interface SessionData {
    user?: AuthSessionUser;
    csrfToken?: string;
    oauth?: {
      stateHash: string;
      nonce: string;
      verifier: string;
      portal: 'member' | 'admin';
      expiresAt: number;
    };
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
