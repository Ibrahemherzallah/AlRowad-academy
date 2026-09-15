import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional classNames and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a price with the shekel symbol, respecting locale digits. */
export function formatPrice(amount: number, lang = 'ar'): string {
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(amount);
  return `${formatted} ₪`;
}
