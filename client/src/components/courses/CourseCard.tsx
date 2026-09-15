import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import type { Course } from '@/lib/types';

function lessonCount(course: Course): number {
  return course.curriculum?.reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0) ?? 0;
}

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const comingSoon = course.status === 'coming_soon';
  const hasDiscount =
    course.discountedPrice != null && course.discountedPrice < course.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -4 }}
    >
      <Link to={`/courses/${course.slug}`} className="group block h-full">
        <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={loc(course.title)}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid size-full place-items-center gradient-brand text-4xl font-extrabold text-primary-foreground/90">
                {loc(course.title).charAt(0)}
              </div>
            )}
            <div className="absolute top-3 start-3 flex gap-2">
              <Badge variant="secondary">{course.category}</Badge>
              {comingSoon && <Badge variant="accent">{t('common.comingSoon')}</Badge>}
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary">
              {loc(course.title)}
            </h3>
            <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
              {loc(course.description)}
            </p>

            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {lessonCount(course)} {i18n.language === 'ar' ? 'درس' : 'lessons'}
              </span>
              {course.instructorName && <span>· {course.instructorName}</span>}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-primary">
                  {formatPrice(course.effectivePrice, i18n.language)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(course.price, i18n.language)}
                  </span>
                )}
              </div>
              <ArrowLeft className="size-4 text-primary transition-transform group-hover:-translate-x-1 rtl:rotate-0 ltr:rotate-180" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
