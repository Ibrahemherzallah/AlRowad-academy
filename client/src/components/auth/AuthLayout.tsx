import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GraduationCap, Users, Award, TrendingUp } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const HIGHLIGHTS = [
  { icon: GraduationCap, key: 'home.statsCourses' },
  { icon: Users, key: 'home.statsStudents' },
  { icon: Award, key: 'home.statsGraduates' },
  { icon: TrendingUp, key: 'home.ctaRegister' },
] as const;

/** Two-column auth shell: brand/marketing panel + form panel. */
export function AuthLayout({ title, subtitle, children }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden gradient-brand lg:block">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 start-10 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 end-0 size-96 rounded-full bg-black/10 blur-3xl" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="inline-flex">
            <span className="text-2xl font-extrabold text-primary-foreground">
              {t('common.academy')}
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="max-w-md text-3xl font-extrabold leading-tight">
              {t('home.heroTitle')}
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/80">{t('common.tagline')}</p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {HIGHLIGHTS.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm"
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="text-sm font-medium">{t(key)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {t('common.academy')}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
