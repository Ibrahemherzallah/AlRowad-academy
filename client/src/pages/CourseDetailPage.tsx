import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, PlayCircle, Lock, User, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { useLocalized } from '@/hooks/useLocalized';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { formatPrice } from '@/lib/utils';
import { fetchCourseBySlug, type CourseDetail } from '@/lib/courses.api';
import { useAuthStore } from '@/store/auth.store';

function fmtDuration(sec: number, lang: string): string {
  const m = Math.round(sec / 60);
  return `${m} ${lang === 'ar' ? 'د' : 'min'}`;
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const { user } = useAuthStore();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchCourseBySlug(slug)
      .then(setCourse)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useDocumentMeta({
    title: course ? loc(course.title) : undefined,
    description: course ? loc(course.description) : undefined,
    ogImage: course?.thumbnail,
  });

  if (loading) {
    return (
      <div className="container grid gap-8 py-12 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold">{t('courses.noResults')}</h1>
        <Button asChild className="mt-6">
          <Link to="/courses">{t('nav.courses')}</Link>
        </Button>
      </div>
    );
  }

  const totalLessons =
    course.curriculum?.reduce((s, sec) => s + (sec.lessons?.length ?? 0), 0) ?? 0;
  const hasDiscount = course.discountedPrice != null && course.discountedPrice < course.price;
  const comingSoon = course.status === 'coming_soon';

  const learnPoints = [
    t('courses.whatYouLearn'),
    course.category,
    course.instructorName,
  ].filter(Boolean);

  return (
    <div className="container py-12">
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{course.category}</Badge>
              {comingSoon && <Badge variant="accent">{t('common.comingSoon')}</Badge>}
              {course.isFull && <Badge variant="muted">{t('courses.full')}</Badge>}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
              {loc(course.title)}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{loc(course.description)}</p>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <PlayCircle className="size-4" />
                {totalLessons} {i18n.language === 'ar' ? 'درس' : 'lessons'}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4" />
                {course.enrolledCount} {i18n.language === 'ar' ? 'مسجّل' : 'enrolled'}
              </span>
              {course.instructorName && (
                <span className="flex items-center gap-1.5">
                  <User className="size-4" />
                  {course.instructorName}
                </span>
              )}
            </div>
          </motion.div>

          {/* Thumbnail / preview */}
          <div className="mt-8 aspect-video overflow-hidden rounded-xl bg-muted">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={loc(course.title)} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center gradient-brand text-6xl font-extrabold text-primary-foreground/90">
                {loc(course.title).charAt(0)}
              </div>
            )}
          </div>

          {/* What you'll learn */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">{t('courses.whatYouLearn')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {learnPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-sm">{point}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Curriculum */}
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">{t('courses.curriculum')}</h2>
            <div className="space-y-3">
              {course.curriculum?.map((section) => (
                <div key={section._id} className="rounded-lg border border-border bg-card">
                  <div className="border-b border-border px-5 py-3 font-semibold">
                    {section.title}
                  </div>
                  <ul className="divide-y divide-border">
                    {section.lessons?.map((lesson) => (
                      <li key={lesson._id} className="flex items-center justify-between px-5 py-3">
                        <span className="flex items-center gap-2 text-sm">
                          {lesson.isFreePreview ? (
                            <PlayCircle className="size-4 text-primary" />
                          ) : (
                            <Lock className="size-4 text-muted-foreground" />
                          )}
                          {lesson.title}
                          {lesson.isFreePreview && (
                            <Badge variant="success" className="ms-1">
                              {t('common.free')}
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fmtDuration(lesson.duration, i18n.language)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Instructor */}
          {course.instructorBio && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold">{t('courses.instructor')}</h2>
              <Card className="flex items-start gap-4 p-5">
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {course.instructorName?.charAt(0) ?? '؟'}
                </div>
                <div>
                  <p className="font-semibold">{course.instructorName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{course.instructorBio}</p>
                </div>
              </Card>
            </section>
          )}

          {/* FAQ */}
          {course.faqs?.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold">{t('courses.faq')}</h2>
              <Accordion>
                {course.faqs.map((faq, i) => (
                  <AccordionItem key={i} title={faq.question}>
                    {faq.answer}
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </div>

        {/* Sticky enroll card */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <Card className="p-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-primary">
                  {formatPrice(course.effectivePrice, i18n.language)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(course.price, i18n.language)}
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {comingSoon ? (
                  <Button size="lg" className="w-full" variant="accent" disabled>
                    {t('common.comingSoon')}
                  </Button>
                ) : course.isFull ? (
                  <Button size="lg" className="w-full" variant="secondary" disabled>
                    {t('courses.full')}
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" asChild>
                    <Link to={user ? `/checkout/${course.slug}` : `/register?next=/checkout/${course.slug}`}>
                      {t('courses.enroll')}
                    </Link>
                  </Button>
                )}
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  {totalLessons} {i18n.language === 'ar' ? 'درس مسجّل' : 'recorded lessons'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  {i18n.language === 'ar' ? 'متابعة شخصية 1:1' : '1:1 personal follow-up'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  {i18n.language === 'ar' ? 'شهادة إتمام' : 'Certificate of completion'}
                </li>
              </ul>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
