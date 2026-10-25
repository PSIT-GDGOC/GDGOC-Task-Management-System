import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});
describe('API sessions and task pagination', () => {
  it('coalesces concurrent CSRF initialization and includes cookies', async () => {
    const fetch = vi.fn().mockResolvedValue(reply({ csrfToken: 'token' }));
    vi.stubGlobal('fetch', fetch);
    const api = await import('./api');
    expect(await Promise.all([api.getCsrfToken(), api.getCsrfToken()])).toEqual(['token', 'token']);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].credentials).toBe('include');
  });
  it('does not perform a mutation when secure session initialization fails', async () => {
    const fetch = vi.fn().mockResolvedValue(reply({}, 503));
    vi.stubGlobal('fetch', fetch);
    const api = await import('./api');
    await expect(api.apiRequest('/tasks', 'POST', {})).rejects.toThrow('secure session');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('refreshes a rotated CSRF token once before retrying the rejected mutation', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply({ csrfToken: 'old' }))
      .mockResolvedValueOnce(
        reply({ error: { message: 'A valid X-CSRF-Token header is required' } }, 403),
      )
      .mockResolvedValueOnce(reply({ csrfToken: 'new' }))
      .mockResolvedValueOnce(reply({ success: true }));
    vi.stubGlobal('fetch', fetch);
    const api = await import('./api');
    await expect(api.apiRequest('/tasks/task/start', 'POST')).resolves.toEqual({ success: true });
    expect(fetch.mock.calls[3][1].headers['X-CSRF-Token']).toBe('new');
  });
  it('never retries a permission denial as though it were a CSRF error', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply({ csrfToken: 'token' }))
      .mockResolvedValueOnce(reply({ error: { message: 'You cannot manage this team' } }, 403));
    vi.stubGlobal('fetch', fetch);
    const api = await import('./api');
    await expect(api.apiRequest('/tasks', 'POST', {})).rejects.toThrow('cannot manage');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('loads all task pages instead of silently stopping at 100', async () => {
    const row = (id: string) => ({
      id,
      title: 'Task',
      description: 'Task description',
      status: 'ASSIGNED',
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply({ data: [row('first')], pagination: { totalPages: 2 } }))
      .mockResolvedValueOnce(reply({ data: [row('second')], pagination: { totalPages: 2 } }));
    vi.stubGlobal('fetch', fetch);
    const api = await import('./api');
    expect((await api.taskApi.fetchTasks()).map((task) => task.id)).toEqual(['first', 'second']);
    expect(fetch.mock.calls[1][0]).toContain('page=2');
  });
  it('does not derive authenticated permissions from the login form hints', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply({ csrfToken: 'token' }))
      .mockResolvedValueOnce(
        reply({
          csrfToken: 'new',
          user: { id: 'member', role: 'USER', position: 'Team Member', teamMemberships: [] },
        }),
      )
      .mockResolvedValueOnce(
        reply({
          user: { id: 'member', role: 'USER', position: 'Team Member', teamMemberships: [] },
        }),
      );
    vi.stubGlobal('fetch', fetch);
    const api = await import('./api');
    const user = await api.authApi.loginDev(
      'member@example.com',
      undefined,
      'MEMBER',
      'President',
      'tech',
      true,
    );
    expect(user.role).toBe('MEMBER');
    expect(user.isTeamHead).toBe(false);
  });
});

it('uses a same-origin API in production even when an old Render URL is configured', async () => {
  vi.stubEnv('PROD', true);
  vi.stubEnv('VITE_API_URL', 'https://gdgoc-tracking-backend.onrender.com/api/v1');
  const fetch = vi.fn().mockResolvedValue(reply({ csrfToken: 'cookie-session' }));
  vi.stubGlobal('fetch', fetch);
  const api = await import('./api');
  await api.getCsrfToken();
  expect(fetch.mock.calls[0][0]).toBe('/api/v1/auth/csrf');
});
it('rejects login when the browser cannot send the newly issued session cookie', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(reply({ csrfToken: 'token' }))
    .mockResolvedValueOnce(reply({ csrfToken: 'new', user: { id: 'member' } }))
    .mockResolvedValueOnce(reply({ error: { message: 'Authentication required' } }, 401));
  vi.stubGlobal('fetch', fetch);
  const api = await import('./api');
  await expect(api.authApi.loginDev('member@example.com')).rejects.toThrow(
    'could not keep your sign-in session',
  );
});
it('distinguishes an expired session from a temporary server failure during reload', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(reply({ error: { message: 'Server temporarily unavailable' } }, 503))
    .mockResolvedValueOnce(reply({ error: { message: 'Authentication required' } }, 401));
  vi.stubGlobal('fetch', fetch);
  const api = await import('./api');
  await expect(api.authApi.getCurrentUser()).rejects.toThrow('Server temporarily unavailable');
  await expect(api.authApi.getCurrentUser()).resolves.toBeNull();
});

it('treats an HTML fallback as a server error rather than an expired session', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('<html>frontend fallback</html>', { status: 200 })),
  );
  const api = await import('./api');
  await expect(api.authApi.getCurrentUser()).rejects.toThrow('invalid response');
});
