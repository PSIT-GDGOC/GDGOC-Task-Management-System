import { describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app';

describe('POST /api/v1/webhooks/github', () => {
  it('should reject webhook request without signature', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/github')
      .send({ action: 'opened' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Missing X-Hub-Signature-256');
  });

  it('should reject webhook with invalid signature', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/github')
      .set('x-hub-signature-256', 'sha256=invalidhexvalue12345')
      .set('x-github-event', 'ping')
      .send({ zen: 'Keep it logically awesome.' });

    expect(res.status).toBe(401);
  });
});
