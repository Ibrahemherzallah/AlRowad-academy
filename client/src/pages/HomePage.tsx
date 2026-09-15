import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseGridSkeleton } from '@/components/courses/CourseCardSkeleton';
import { HeroSlider, type HeroSlide } from '@/components/home/HeroSlider';
import { fetchCourses } from '@/lib/courses.api';
import type { Course } from '@/lib/types';

/**
 * Hero background images. Swap these URLs for your own academy photography
 * (classrooms, workshops, students) — ideally 1920×1080, optimized. The
 * Unsplash URLs below are royalty-free education/tech shots as placeholders.
 */
const HERO_SLIDES: HeroSlide[] = [
  {
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80',
    alt: 'طلاب يتعلمون معاً',
  },
  {
    image:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1920&q=80',
    alt: 'ورشة عمل تقنية',
  },
  {
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1920&q=80',
    alt: 'بيئة تعلّم حديثة',
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses({ limit: 3, sort: 'newest' })
      .then((res) => setFeatured(res.courses))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
    <section className="relative overflow-hidden">
      {/* Hero image slider (background) */}
      <HeroSlider slides={HERO_SLIDES} />

      {/* Ambient accent glow layered over the slider veil */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-24 start-1/4 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-32 end-1/4 size-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative z-10 flex flex-col items-center py-28 text-center md:py-40">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur"
        >
          <Sparkles className="size-4 text-accent" />
          {t('common.tagline')}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
        >
          {t('home.heroTitle')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          {t('home.heroSubtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button size="lg" asChild>
            <Link to="/register">
              {t('home.ctaRegister')}
              <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/courses">{t('home.ctaCourses')}</Link>
          </Button>
        </motion.div>
      </div>
    </section>

    {/* Featured courses */}
    <section className="container py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold md:text-3xl">{t('home.featuredCourses')}</h2>
          <p className="mt-1 text-muted-foreground">{t('home.whyUs')}</p>
        </div>
        <Button variant="ghost" asChild className="hidden sm:inline-flex">
          <Link to="/courses">
            {t('common.viewAll')}
            <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <CourseGridSkeleton count={3} />
      ) : featured.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course, i) => (
            <CourseCard key={course._id} course={course} index={i} />
          ))}
        </div>
      ) : null}
    </section>
    </>
  );
}
