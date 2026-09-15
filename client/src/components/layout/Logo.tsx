import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    /** Hide the academy name text, showing only the mark. */
    markOnly?: boolean;
}

export function Logo({ className, markOnly = false }: LogoProps) {
    const { t } = useTranslation();
    return (
        <Link
            to="/"
            className={cn('flex items-center gap-2 font-extrabold', className)}
            aria-label={t('common.academy')}
        >
            <img
                src="/logo.png"
                alt={t('common.academy')}
                className="h-9 w-auto object-contain"
                width={36}
                height={36}
            />
            {!markOnly && (
                <span className="text-lg tracking-tight">{t('common.academy')}</span>
            )}
        </Link>
    );
}
