// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './authContext';
import { ProtectedRoute } from './ProtectedRoute';
import { authApi } from '../services/api';
vi.mock('../services/api', () => ({
  authApi: { getCurrentUser: vi.fn(), loginDev: vi.fn(), logout: vi.fn(), updateName: vi.fn() },
}));
const user = {
  id: 'member',
  name: 'Real Member',
  email: 'member@example.com',
  role: 'MEMBER' as const,
};
const mount = () =>
  render(
    <MemoryRouter initialEntries={['/member']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/member"
            element={
              <ProtectedRoute>
                <h1>My workspace</h1>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<h1>Sign in</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});
afterEach(cleanup);
it('waits for the session cookie check and restores a protected route after reload', async () => {
  let resolve!: (value: typeof user) => void;
  vi.mocked(authApi.getCurrentUser)
    .mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    )
    .mockResolvedValue(user);
  const view = mount();
  expect(screen.getByText('Verifying workspace session...')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Sign in' })).toBeNull();
  await act(async () => {
    resolve(user);
  });
  expect(screen.getByRole('heading', { name: 'My workspace' })).toBeTruthy();
  view.unmount();
  mount();
  expect(await screen.findByRole('heading', { name: 'My workspace' })).toBeTruthy();
});
it('shows a retryable session-check error instead of signing out on a temporary outage', async () => {
  vi.mocked(authApi.getCurrentUser)
    .mockRejectedValueOnce(new Error('Server unavailable'))
    .mockResolvedValueOnce(user);
  mount();
  expect(await screen.findByRole('heading', { name: 'Unable to check your session' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Sign in' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry session check' }));
  expect(await screen.findByRole('heading', { name: 'My workspace' })).toBeTruthy();
});
it('redirects an actually expired session even when old cached identities are present', async () => {
  localStorage.setItem('gdgoc_taskflow_session_user', JSON.stringify(user));
  vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);
  mount();
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeTruthy();
  expect(localStorage.getItem('gdgoc_taskflow_session_user')).toBeNull();
});
