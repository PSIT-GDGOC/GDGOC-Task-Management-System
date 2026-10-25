import { beforeEach, expect, it, vi } from 'vitest';
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});
it('adds a CSRF token to admin writes and uses the rotated login token', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(reply({ csrfToken: 'initial' }))
    .mockResolvedValueOnce(reply({ csrfToken: 'rotated', user: { id: 'admin' } }))
    .mockResolvedValueOnce(reply({ success: true }));
  vi.stubGlobal('fetch', fetch);
  const { apiClient } = await import('./api');
  await apiClient('/auth/dev-login', { method: 'POST', body: '{}' });
  await apiClient('/tasks', { method: 'POST', body: '{}' });
  expect(fetch.mock.calls[1][1].headers.get('X-CSRF-Token')).toBe('initial');
  expect(fetch.mock.calls[2][1].headers.get('X-CSRF-Token')).toBe('rotated');
  expect(fetch.mock.calls[2][1].credentials).toBe('include');
});
it('refreshes a rejected CSRF token only once', async () => {
  const error = { error: { message: 'A valid X-CSRF-Token header is required' } };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(reply({ csrfToken: 'initial' }))
    .mockResolvedValueOnce(reply(error, 403))
    .mockResolvedValueOnce(reply({ csrfToken: 'new' }))
    .mockResolvedValueOnce(reply(error, 403));
  vi.stubGlobal('fetch', fetch);
  const { apiClient } = await import('./api');
  await expect(apiClient('/tasks', { method: 'POST' })).rejects.toThrow('X-CSRF-Token');
  expect(fetch).toHaveBeenCalledTimes(4);
});
