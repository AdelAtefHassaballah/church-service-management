/**
 * Standard UUID validation and generation utility
 * Ensures full compatibility with PostgreSQL UUID data types.
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GENERAL_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (str?: string | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  return GENERAL_UUID_REGEX.test(str.trim());
};

export const sanitizeUUID = (str?: string | null): string | null => {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  return GENERAL_UUID_REGEX.test(trimmed) ? trimmed : null;
};

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Standard RFC4122 v4 compliant fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const DEFAULT_CHURCH_ID = '00000000-0000-0000-0000-000000000001';
