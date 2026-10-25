export function displayName(name?: string | null, email?: string | null): string {
  const value = name?.trim() || '';
  if (!value || value.includes('@')) return '';
  const prefix = email?.split('@')[0].toLowerCase();
  if (value.toLowerCase() === prefix && /[\d._-]/.test(value)) return '';
  return value;
}
