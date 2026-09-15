import { useTranslation } from 'react-i18next';
import type { LocalizedString } from '@/lib/types';

/** Returns a function that reads the ar/en field for the active language. */
export function useLocalized() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('en') ? 'en' : 'ar') as keyof LocalizedString;
  return (value?: LocalizedString): string => (value ? value[lang] || value.ar || value.en : '');
}
