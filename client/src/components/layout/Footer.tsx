import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram, Facebook, Send } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">{t('common.tagline')}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold">{t('footer.quickLinks')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/courses" className="hover:text-foreground">
                {t('nav.courses')}
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-foreground">
                {t('nav.services')}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                {t('nav.about')}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold">{t('footer.followUs')}</h4>
          <div className="flex gap-3">
            {[Instagram, Facebook, Send].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="social"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border py-5">
        <p className="container text-center text-xs text-muted-foreground">
          © {year} {t('common.academy')} — {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
