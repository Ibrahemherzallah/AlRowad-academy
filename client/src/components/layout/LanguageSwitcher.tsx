import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const next = i18n.language === 'ar' ? 'en' : 'ar';

  const switchLang = () => {
    void i18n.changeLanguage(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLang}
      className="gap-1.5 font-semibold"
      aria-label="Switch language"
    >
      <Languages className="size-4" />
      {next === 'en' ? 'EN' : 'ع'}
    </Button>
  );
}
