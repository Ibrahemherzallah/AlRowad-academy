import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl } from '@/i18n';

/**
 * Keeps <html> dir/lang and the active font family in sync with the current
 * language. RTL + Cairo for Arabic; LTR + Inter for English.
 */
export function DirectionProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || 'ar';
    const rtl = isRtl(lang);
    const html = document.documentElement;

    html.setAttribute('lang', lang);
    html.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    html.classList.toggle('font-arabic', rtl);
    html.classList.toggle('font-latin', !rtl);
  }, [i18n.language]);

  return <>{children}</>;
}
