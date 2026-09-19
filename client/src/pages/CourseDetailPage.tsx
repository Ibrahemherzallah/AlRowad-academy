import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, User, CheckCircle2, MessageCircle, CalendarClock, GraduationCap } from 'lucide-react';
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

const DAY_NAMES_AR = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const DAY_NAMES_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '970597250539';

function whatsappLink(courseTitle: string) {
  const msg = encodeURIComponent(`أهلاً، أريد الاستفسار عن دورة: ${courseTitle}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}


export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const { } = useAuthStore();

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


  const hasDiscount = course.discountedPrice != null && course.discountedPrice < course.price;
  const comingSoon = course.status === 'coming_soon';

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
            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                {course.totalHours} {i18n.language === 'ar' ? 'ساعة' : 'hour'}
              </span>
              {course.instructorName && (
                <span className="flex items-center gap-1.5">
                  <User className="size-4" />
                  {course.instructorName}
                </span>
              )}
            </div>
          </motion.div>

          {/* Schedules timetable — replaces description in hero area */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold">{t('courses.courseSchedules')}</h2>
            {course.schedules && course.schedules.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {course.schedules.map((s) => (
                  <div key={s._id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <CalendarClock className="size-5" />
                    </div>
                    <div>
                      {s.label && <p className="font-semibold">{s.label}</p>}
                      <p className="text-sm text-muted-foreground">
                        {s.days.map((d) => (i18n.language === 'ar' ? DAY_NAMES_AR[d] : DAY_NAMES_EN[d])).join(' · ')}
                      </p>
                      <p className="mt-1 font-mono text-sm font-medium" dir="ltr">
                        {s.startTime} – {s.endTime}
                      </p>
                      {s.room && <p className="mt-1 text-xs text-muted-foreground">{s.room}</p>}
                      {s.capacity && <p className="text-xs text-muted-foreground">{s.capacity} مقعد</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-card p-5 text-muted-foreground">{t('courses.noSchedules')}</p>
            )}
          </div>

          {/* Course description */}
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {loc(course.description)}
            </p>
          </div>

          {/* Properties (replaces "what you'll learn" + curriculum) */}
          {course.properties?.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold">{t('courses.properties')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {course.properties.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

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

          {/* Teacher bio */}
          {course.teacher && (course.teacher.bio || course.teacher.name) && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold">{t('courses.instructorBio')}</h2>
              <Card className="flex items-start gap-4 p-5">
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xl font-extrabold">
                  {course.teacher.name?.charAt(0) ?? <GraduationCap className="size-6" />}
                </div>
                <div>
                  <p className="font-bold text-lg">{course.teacher.name}</p>
                  {course.teacher.specialty && (
                    <p className="text-sm text-primary mb-2">{course.teacher.specialty}</p>
                  )}
                  {course.teacher.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{course.teacher.bio}</p>
                  )}
                </div>
              </Card>
            </section>
          )}
        </div>

        {/* Sticky enroll card */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <Card className="overflow-hidden p-0">
              {/* Small course thumbnail above price */}
              <div className="aspect-video w-full bg-muted">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={loc(course.title)} className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center gradient-brand text-4xl font-extrabold text-primary-foreground/80">
                    {loc(course.title).charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-6">
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
                  <Button size="lg" className="w-full gap-2 bg-[#25D366] hover:bg-[#20b858] text-white" asChild>
                    <a href={whatsappLink(loc(course.title))} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="size-5" />
                      {t('courses.whatsappBtn')}
                    </a>
                  </Button>
                )}
              </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
