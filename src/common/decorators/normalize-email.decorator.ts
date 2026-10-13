import { Transform } from 'class-transformer';

// Emails are stored and compared in canonical form: trimmed and lowercased
export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const NormalizeEmail = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  );
