import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Link to="/" className={cn('flex items-center gap-2 font-extrabold', className)}>
      <span className="grid size-9 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-sm">
        ر
      </span>
      <span className="text-lg tracking-tight">{t('common.academy')}</span>
    </Link>
  );
}
