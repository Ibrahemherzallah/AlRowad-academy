import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  Gift,
  Users,
  CalendarClock,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { StatCard } from '@/components/dashboard/StatCard.tsx';
import { toast } from '@/components/ui/toast.tsx';
import { useLocalized } from '@/hooks/useLocalized.ts';
import { fetchStudentOverview, type StudentOverview } from '@/lib/dashboard.api.ts';

export default function StudentOverviewPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [data, setData] = useState<StudentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStudentOverview()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const referralUrl = data
    ? `${window.location.origin}/register?ref=${data.referral.code}`
    : '';

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success(t('dashboard.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">{t('common.error')}</p>;
  }

  const { loyalty } = data;
  const loyaltyPct = Math.min(100, Math.round((loyalty.pointsBalance / loyalty.threshold) * 100));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-extrabold md:text-3xl">
          {t('dashboard.welcomeBack')}، {data.name} 👋
        </h2>
        <p className="mt-1 text-muted-foreground">{t('common.tagline')}</p>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('dashboard.enrolledCourses')} value={data.stats.enrolledCount} icon={BookOpen} index={0} />
        <StatCard label={t('dashboard.activeCourses')} value={data.stats.activeCount} icon={GraduationCap} tone="success" index={1} />
        <StatCard label={t('dashboard.invited')} value={data.referral.invited} icon={Users} tone="accent" index={2} />
        <StatCard label={t('dashboard.loyaltyPoints')} value={loyalty.pointsBalance} icon={Gift} tone="primary" index={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Enrolled courses */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{t('dashboard.myCourses')}</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/courses">
                {t('common.viewAll')}
                <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
              </Link>
            </Button>
          </div>

          {data.courses.length === 0 ? (
            <Card className="flex flex-col items-center gap-4 p-10 text-center">
              <BookOpen className="size-10 text-muted-foreground" />
              <p className="text-muted-foreground">{t('dashboard.noCoursesYet')}</p>
              <Button asChild>
                <Link to="/courses">{t('dashboard.browseCourses')}</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.courses.slice(0, 4).map((c, i) => (
                <motion.div
                  key={c.enrollmentId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="flex items-center gap-4 p-4">
                    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                      {c.course?.thumbnail ? (
                        <img src={c.course.thumbnail} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {c.course ? loc(c.course.title).charAt(0) : '؟'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {c.course ? loc(c.course.title) : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.course?.category}</p>
                    </div>
                    <Badge
                      variant={
                        c.status === 'active'
                          ? 'success'
                          : c.status === 'expired'
                            ? 'muted'
                            : c.status === 'completed'
                              ? 'default'
                              : 'secondary'
                      }
                    >
                      {t(`dashboard.${c.status === 'active' ? 'active' : c.status === 'expired' ? 'expired' : c.status === 'completed' ? 'completed' : 'active'}`)}
                    </Badge>
                    {c.status !== 'expired' && c.course && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/dashboard/courses`}>{t('dashboard.viewCourse')}</Link>
                      </Button>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: loyalty + session + referral */}
        <div className="space-y-6">
          {/* Loyalty widget */}
          <Card className="overflow-hidden">
            <div className="gradient-brand p-5 text-primary-foreground">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <Gift className="size-5" />
                  {t('dashboard.loyalty')}
                </span>
                {loyalty.voucherReady && (
                  <Badge variant="accent" className="gap-1">
                    <Sparkles className="size-3" />
                    {t('dashboard.voucherReady')}
                  </Badge>
                )}
              </div>
              <p className="mt-4 text-3xl font-extrabold">
                {loyalty.pointsBalance}
                <span className="text-lg font-medium opacity-70"> / {loyalty.threshold}</span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loyaltyPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-white"
                />
              </div>
              <p className="mt-2 text-xs opacity-80">
                {t('dashboard.nextVoucherAt')} {loyalty.threshold} {i18n.language === 'ar' ? 'نقطة' : 'pts'}
              </p>
            </div>
            {loyalty.voucherReady && loyalty.activeVouchers.length > 0 && (
              <div className="p-4">
                {loyalty.activeVouchers.map((v) => (
                  <div key={v.code} className="flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                    <span className="font-mono font-bold text-primary" dir="ltr">{v.code}</span>
                    <Badge variant="success">{v.discountPercent}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming session */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-bold">
              <CalendarClock className="size-5 text-primary" />
              {t('dashboard.upcomingSession')}
            </h3>
            {data.upcomingSession ? (
              <div className="mt-3">
                <p className="font-semibold">
                  {new Date(data.upcomingSession.scheduledAt).toLocaleString(
                    i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                    { dateStyle: 'medium', timeStyle: 'short' },
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.upcomingSession.duration} {i18n.language === 'ar' ? 'دقيقة' : 'min'} · {data.upcomingSession.type}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t('dashboard.noSession')}</p>
            )}
          </Card>

          {/* Referral link */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-bold">
              <Users className="size-5 text-primary" />
              {t('dashboard.yourReferralLink')}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.referral.invited} {t('dashboard.invited')} · {data.referral.converted} {t('dashboard.converted')}
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2">
              <span className="flex-1 truncate text-xs" dir="ltr">{referralUrl}</span>
              <Button size="sm" variant="ghost" onClick={copyReferral} className="shrink-0">
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
