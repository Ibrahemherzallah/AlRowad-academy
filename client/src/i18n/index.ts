import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from './locales/ar.json';
import en from './locales/en.json';

export const SUPPORTED_LANGS = ['ar', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const RTL_LANGS: Lang[] = ['ar'];

export function isRtl(lang: string): boolean {
  return RTL_LANGS.includes(lang as Lang);
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'ar',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'rawad_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
