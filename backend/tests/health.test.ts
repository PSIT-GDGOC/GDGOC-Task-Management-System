import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('GET /health', () => {
  it('should return 200 OK and healthy status payload', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('service', 'gdgoc-task-management-server');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });
});

it('does not expose email-sending or configuration diagnostics as public health routes', async () => {
  for (const path of ['/health/email-test?to=outside@example.com','/health/email-check']) {
    expect((await request(app).get(path)).status).toBe(404);
  }
});
