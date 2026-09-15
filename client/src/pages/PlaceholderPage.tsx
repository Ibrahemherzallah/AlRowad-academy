import { useTranslation } from 'react-i18next';

/** Temporary stand-in for pages built in later feature modules. */
export default function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-3xl font-extrabold">{t(titleKey)}</h1>
      <p className="mt-3 text-muted-foreground">{t('common.comingSoon')}</p>
    </div>
  );
}
