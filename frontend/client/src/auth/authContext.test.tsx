// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './authContext';
import { authApi } from '../services/api';
import type { AuthContextType, User } from '../types/auth';
vi.mock('../services/api', () => ({
  authApi: { getCurrentUser: vi.fn(), loginDev: vi.fn(), updateName: vi.fn(), logout: vi.fn() },
}));
let auth: AuthContextType;
const member: User = {
  id: 'member',
  name: 'Member Name',
  email: 'member@example.com',
  role: 'MEMBER',
};
function Probe() {
  auth = useAuth();
  return <span>{auth.user?.name || 'Signed out'}</span>;
}
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);
});
afterEach(cleanup);
async function mount() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() => expect(auth.isLoading).toBe(false));
}
describe('Server backed authentication', () => {
  it('ignores stored elevated preview identities', async () => {
    localStorage.setItem('gdgoc_current_user', JSON.stringify({ ...member, role: 'ADMIN' }));
    await mount();
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('gdgoc_current_user')).toBeNull();
  });
  it('keeps the user signed out when the backend is unavailable or rejects a key', async () => {
    await mount();
    for (const error of [
      new Error('Failed to fetch'),
      Object.assign(new Error('Invalid or expired'), { status: 400 }),
    ]) {
      vi.mocked(authApi.loginDev).mockRejectedValue(error);
      await act(async () => {
        await expect(
          auth.login({ email: 'admin@example.com', password: 'password', invitationKey: 'TECH' }),
        ).rejects.toThrow(error.message);
      });
      expect(auth.user).toBeNull();
    }
  });
  it('uses the server role and keeps the login form mounted during a failed login', async () => {
    await mount();
    vi.mocked(authApi.loginDev).mockResolvedValue(member);
    await act(async () => {
      await auth.login({ email: member.email, position: 'President' });
    });
    expect(auth.user?.role).toBe('MEMBER');
    expect(auth.isLoading).toBe(false);
  });
  it('preserves the displayed name and authenticated session when saving or logout fails', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(member);
    await mount();
    vi.mocked(authApi.updateName).mockRejectedValue(new Error('Name update failed'));
    await act(async () => {
      await expect(auth.updateUserName('New Name')).rejects.toThrow();
    });
    expect(auth.user?.name).toBe(member.name);
    vi.mocked(authApi.logout).mockRejectedValue(new Error('Sign out failed'));
    await act(async () => {
      await expect(auth.logout()).rejects.toThrow();
    });
    expect(auth.isAuthenticated).toBe(true);
  });
});
