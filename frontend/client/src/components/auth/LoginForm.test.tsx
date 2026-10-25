// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';
vi.mock('../../auth/authContext', () => ({ useAuth: () => ({ login: vi.fn() }) }));
afterEach(cleanup);
it('clears email, password and password visibility on each profile change', () => {
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'President' }));
  fireEvent.change(screen.getByLabelText('Email Address'), {
    target: { value: 'president@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'private password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  fireEvent.click(screen.getByRole('button', { name: 'Team Crew' }));
  expect((screen.getByLabelText('Email Address') as HTMLInputElement).value).toBe('');
  expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe('');
  expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe('password');
  fireEvent.change(screen.getByLabelText('Email Address'), {
    target: { value: 'crew@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Team Lead' }));
  expect((screen.getByLabelText('Email Address') as HTMLInputElement).value).toBe('');
});
