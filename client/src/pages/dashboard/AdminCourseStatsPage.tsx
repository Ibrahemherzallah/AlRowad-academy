import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, TrendingUp, Users, Wallet, Percent } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { adminApi, type CourseStats } from '@/lib/admin.api';

export default function AdminCourseStatsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [data, setData] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminApi.courseStats(id).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-muted-foreground">{t('common.error')}</p>;

  const { totals } = data;
  const statusVariant = (s: string) => (s === 'paid' ? 'success' : s === 'partial' ? 'accent' : 'muted');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/courses"><ArrowLeft className="size-5 rtl:rotate-0 ltr:rotate-180" /></Link>
        </Button>
        <div>
          <h2 className="text-2xl font-extrabold">{loc(data.course.title)}</h2>
          {data.course.teacher && (
            <p className="text-sm text-muted-foreground">{t('admin.teacher')}: {data.course.teacher.name}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin.revenue')} value={formatPrice(totals.revenue, i18n.language)} icon={TrendingUp} tone="success" index={0} />
        <StatCard label={t('admin.enrolledStudents')} value={totals.enrolled} icon={Users} index={1} />
        <StatCard label={t('admin.teacherPayout')} value={formatPrice(totals.teacherCommissionOwed + totals.teacherCommissionPaid, i18n.language)} icon={Wallet} tone="accent" index={2} />
        <StatCard label={t('admin.discounts')} value={formatPrice(totals.discountsGiven, i18n.language)} icon={Percent} tone="destructive" index={3} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">{t('admin.outstanding')}</p>
          <p className="text-2xl font-extrabold text-accent-foreground">{formatPrice(totals.outstanding, i18n.language)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">{t('admin.commissionPaid')} / {t('admin.commissionOwed')}</p>
          <p className="text-2xl font-extrabold">
            <span className="text-success">{formatPrice(totals.teacherCommissionPaid, i18n.language)}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-accent-foreground">{formatPrice(totals.teacherCommissionOwed, i18n.language)}</span>
          </p>
        </Card>
      </div>

      {/* Who paid how much */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-3 font-bold">{t('admin.enrolledStudents')}</div>
        {data.students.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">{t('admin.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 text-start font-semibold">{t('admin.student')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.paid')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.remaining')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{s.student?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{s.student?.phone}</p>
                    </td>
                    <td className="p-3 font-semibold">{formatPrice(s.paid, i18n.language)}</td>
                    <td className="p-3 text-muted-foreground">{formatPrice(s.remaining, i18n.language)}</td>
                    <td className="p-3">
                      <Badge variant={statusVariant(s.paymentStatus)}>{s.paymentStatus}</Badge>
                      {s.viaInvite && <Badge variant="secondary" className="ms-2">{t('admin.viaInvite')}</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
