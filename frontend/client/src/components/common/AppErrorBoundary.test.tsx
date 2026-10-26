// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AppErrorBoundary } from './AppErrorBoundary';
afterEach(cleanup);
it('renders recovery controls instead of a blank screen after a render failure', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  function Broken(): never {
    throw new Error('Rendering failed');
  }
  try {
    render(
      <AppErrorBoundary>
        <Broken />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'Unable to display this page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Return to TaskHub' }).getAttribute('href')).toBe('/');
  } finally {
    error.mockRestore();
  }
});
