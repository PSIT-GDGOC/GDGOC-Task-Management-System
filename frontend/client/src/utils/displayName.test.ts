import { expect, it } from 'vitest';
import { displayName } from './displayName';
it('shows entered names without deriving greetings from email handles', () => {
  expect(displayName('Shikhar Yadav', 'shikharyadav595@gmail.com')).toBe('Shikhar Yadav');
  expect(displayName('shikharyadav595', 'shikharyadav595@gmail.com')).toBe('');
  expect(displayName('member@example.com', 'member@example.com')).toBe('');
  expect(displayName('Sam', 'sam@example.com')).toBe('Sam');
});
