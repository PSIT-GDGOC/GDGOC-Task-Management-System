// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RootRedirector } from '../App';
import { AuthProvider } from './authContext';
import { authApi } from '../services/api';
import type { User } from '../types/auth';
vi.mock('../services/api', () => ({ authApi: { getCurrentUser: vi.fn() } }));
vi.mock('../pages/LoginPage', () => ({
  LoginPage: () => <label>Sign in email<input aria-label="Email" /></label>,
}));
afterEach(cleanup);
function mount() {
  render(<MemoryRouter><AuthProvider><Routes>
    <Route path="/" element={<RootRedirector />} />
    <Route path="/member" element={<h1>Member workspace</h1>} />
  </Routes></AuthProvider></MemoryRouter>);
}
it('shows public sign-in while the API is pending and preserves input when the check ends', async () => {
  let resolve!: (user: User | null) => void;
  vi.mocked(authApi.getCurrentUser).mockReturnValue(new Promise(done => { resolve = done; }));
  mount();
  fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'member@example.com'}});
  expect(screen.queryByText('Member workspace')).toBeNull();
  await act(async () => { resolve(null); });
  expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('member@example.com');
});
it('restores a server-confirmed member to their workspace', async () => {
  vi.mocked(authApi.getCurrentUser).mockResolvedValue({id:'member',name:'Member',email:'member@example.com',role:'MEMBER'});
  mount();
  expect(await screen.findByRole('heading', {name:'Member workspace'})).toBeTruthy();
});
it('keeps public sign-in available when the session endpoint fails', async () => {
  vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Server unavailable'));
  await act(async () => { mount(); });
  expect(screen.getByLabelText('Email')).toBeTruthy();
  expect(screen.queryByText('Member workspace')).toBeNull();
});
