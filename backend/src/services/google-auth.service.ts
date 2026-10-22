import crypto from 'node:crypto';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthService } from './auth.service';
import type { Request } from 'express';

export const googleClient = new OAuth2Client({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_CALLBACK_URL,
  transporterOptions: { timeout: 10_000, retry: false },
});
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const save = (req: Request) =>
  new Promise<void>((resolve, reject) =>
    req.session.save((error) => (error ? reject(error) : resolve())),
  );
export class GoogleAuthService {
  static configured() {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  }
  static async begin(req: Request, portal: 'member' | 'admin') {
    if (!this.configured()) throw new AppError('Google authentication is not configured', 503);
    const state = crypto.randomBytes(32).toString('base64url');
    const nonce = crypto.randomBytes(32).toString('base64url');
    const pkce = await googleClient.generateCodeVerifierAsync();
    const stateHash = hash(state);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // Invalidate the previous attempt for this browser; retain no access/refresh token.
    if (req.session.oauth)
      await prisma.oAuthAttempt.deleteMany({ where: { stateHash: req.session.oauth.stateHash } });
    await prisma.oAuthAttempt.create({
      data: { stateHash, sessionHash: hash(req.sessionID), expiresAt },
    });
    req.session.oauth = {
      stateHash,
      nonce,
      verifier: pkce.codeVerifier,
      portal,
      expiresAt: expiresAt.getTime(),
    };
    await save(req);
    const url = new URL(
      googleClient.generateAuthUrl({
        scope: ['openid', 'email', 'profile'],
        state,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
        prompt: 'select_account',
      }),
    );
    url.searchParams.set('nonce', nonce);
    return url.toString();
  }
  static async callback(req: Request, state: string, code?: string, denied?: string) {
    const attempt = req.session.oauth;
    if (!attempt || attempt.expiresAt <= Date.now() || hash(state) !== attempt.stateHash)
      throw new AppError('Invalid or expired Google sign-in state', 400);
    const consumed = await prisma.oAuthAttempt.updateMany({
      where: {
        stateHash: attempt.stateHash,
        sessionHash: hash(req.sessionID),
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) throw new AppError('Google sign-in state has already been used', 400);
    delete req.session.oauth;
    await save(req);
    if (denied || !code) throw new AppError('Google sign-in was cancelled or denied', 400);
    let payload;
    try {
      const { tokens } = await googleClient.getToken({
        code,
        codeVerifier: attempt.verifier,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
      });
      if (!tokens.id_token) throw new Error('Missing ID token');
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload() as ReturnType<typeof ticket.getPayload> & { nonce?: string };
    } catch {
      throw new AppError('Google sign-in could not be verified', 401);
    }
    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true ||
      payload.nonce !== attempt.nonce ||
      !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)
    )
      throw new AppError('Google identity could not be verified', 401);
    const user = await AuthService.handleVerifiedGoogleUser({
      email: payload.email,
      name: payload.name ?? payload.email,
      avatarUrl: payload.picture,
      subject: payload.sub,
      authoritativeEmail: payload.email.toLowerCase().endsWith('@gmail.com') || Boolean(payload.hd),
    });
    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve())),
    );
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      position: user.position,
      githubUsername: user.githubUsername,
    };
    req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
    await save(req);
    return attempt.portal === 'admin' ? env.ADMIN_ORIGIN : env.CLIENT_ORIGIN;
  }
}
