// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';
import { ThemeToggle } from './ThemeToggle';
beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});
afterEach(cleanup);
it('toggles the entire document and remembers the selected mode after remount', () => {
  const view = render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  expect(localStorage.getItem('taskhub-theme')).toBe('dark');
  view.unmount();
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(
    screen.getByRole('button', { name: 'Switch to light mode' }).getAttribute('aria-pressed'),
  ).toBe('true');
  expect(document.documentElement.style.colorScheme).toBe('dark');
});
it('restores an explicit light preference', () => {
  localStorage.setItem('taskhub-theme', 'light');
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeTruthy();
  expect(document.documentElement.style.colorScheme).toBe('light');
});
