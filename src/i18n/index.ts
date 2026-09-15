import { en } from './en';
import { ar } from './ar';

export type Language = 'en' | 'ar';
export type TranslationDict = typeof en;

export const translations = {
  en,
  ar,
};

export function getNestedTranslation(obj: any, path: string): string {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}
