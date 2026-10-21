import crypto from 'crypto';

/**
 * Utility: Generate a SHA-256 hash of a string (e.g., invitation codes)
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input.trim()).digest('hex');
}

/**
 * Utility: Compare buffers in constant time
 */
export function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
