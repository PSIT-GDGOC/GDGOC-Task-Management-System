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

it('defaults to dark mode, toggles to light mode, and remembers the selected mode after remount', () => {
  const view = render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  // Defaults to dark mode
  expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeTruthy();
  expect(document.documentElement.classList.contains('dark')).toBe(true);

  // Click to toggle to light mode
  fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  expect(localStorage.getItem('taskhub-theme')).toBe('light');

  view.unmount();

  // Remount should remember light preference
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(
    screen.getByRole('button', { name: 'Switch to dark mode' }).getAttribute('aria-pressed'),
  ).toBe('false');
  expect(document.documentElement.style.colorScheme).toBe('light');
});

it('restores an explicit dark preference', () => {
  localStorage.setItem('taskhub-theme', 'dark');
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeTruthy();
  expect(document.documentElement.style.colorScheme).toBe('dark');
});
