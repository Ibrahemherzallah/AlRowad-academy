import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Code2,
  Palette,
  Headphones,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, fadeUp, staggerContainer } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

interface Department {
  title: string;
  desc: string;
  items: string[];
  color: keyof typeof COLORS;
}

/** Per-department accent palette (icon bg, marker, top bar, watermark). */
const COLORS = {
  violet: {
    icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white',
    marker: 'text-violet-500',
    bar: 'from-violet-500 to-fuchsia-500',
    glow: 'group-hover:shadow-violet-500/10',
  },
  blue: {
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
    marker: 'text-blue-500',
    bar: 'from-blue-500 to-cyan-500',
    glow: 'group-hover:shadow-blue-500/10',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
    marker: 'text-amber-500',
    bar: 'from-amber-500 to-orange-500',
    glow: 'group-hover:shadow-amber-500/10',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
    marker: 'text-emerald-500',
    bar: 'from-emerald-500 to-teal-500',
    glow: 'group-hover:shadow-emerald-500/10',
  },
} as const;

const ICONS = [GraduationCap, Code2, Palette, Headphones];

export function WhatWeProvideSection() {
  const { t } = useTranslation();
  const departments = t('home.departments', { returnObjects: true }) as Department[];

  return (
    <section className="container py-16 md:py-24">
      <Reveal className="mb-12">
        <span className="mb-3 inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
          <span className="h-px w-8 bg-gradient-to-r from-primary to-accent" />
          {t('home.ourServices')}
        </span>
        <h2 className="text-3xl font-extrabold md:text-4xl">{t('home.whatWeProvideTitle')}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t('home.whatWeProvideSubtitle')}</p>
      </Reveal>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="grid gap-6 md:grid-cols-2"
      >
        {departments.map((dept, i) => {
          const Icon = ICONS[i % ICONS.length];
          const c = COLORS[dept.color];
          return (
            <motion.div key={dept.title} variants={fadeUp}>
              <div
                className={cn(
                  'group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-500',
                  'hover:-translate-y-1.5 hover:shadow-2xl',
                  c.glow,
                )}
              >
                {/* Top accent bar — grows in on hover */}
                <span
                  className={cn(
                    'absolute inset-x-0 top-0 h-1 origin-center scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100',
                    c.bar,
                  )}
                />

                {/* Watermark number */}
                <span className="pointer-events-none absolute bottom-4 end-6 text-7xl font-extrabold text-foreground/[0.04] transition-colors group-hover:text-foreground/[0.07]">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Icon */}
                <div
                  className={cn(
                    'mb-6 grid size-16 place-items-center rounded-2xl transition-all duration-500 group-hover:scale-110',
                    c.icon,
                  )}
                >
                  <Icon className="size-8" />
                </div>

                <h3 className="text-xl font-extrabold">{dept.title}</h3>
                <p className="mt-2 text-muted-foreground">{dept.desc}</p>

                <ul className="mt-6 space-y-3">
                  {dept.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium">
                      <span
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-full bg-muted',
                          c.marker,
                        )}
                      >
                        <Check className="size-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <Reveal className="mt-12 flex justify-center">
        <Button asChild size="lg">
          <Link to="/contact">
            {t('common.contactNow')}
            <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
          </Link>
        </Button>
      </Reveal>
    </section>
  );
}
