import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, BookOpen, GraduationCap, CreditCard, CalendarClock, TrendingUp, Plus, ArrowLeft, ShieldCheck, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { fetchAdminOverview, type AdminOverview } from '@/lib/dashboard.api';
import { useAuthStore } from '@/store/auth.store';

export default function AdminOverviewPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'superadmin';

  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminOverview().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-72" />
    </div>
  );

  if (!data) return <p className="text-muted-foreground">{t('common.error')}</p>;

  const statusVariant = (s: string) =>
    s === 'active' || s === 'paid' ? 'success'
    : s === 'pending' || s === 'partial' ? 'accent'
    : 'muted';

  return (
    <div className="space-y-8">

      {/* Revenue banner — superadmin only */}
      {isSuperAdmin && data.revenue && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gradient-brand p-6 text-primary-foreground">
            <div className="flex items-center gap-2 text-sm opacity-80"><TrendingUp className="size-4" />{t('admin.revenueMonth')}</div>
            <p className="mt-2 text-3xl font-extrabold">{formatPrice(data.revenue.thisMonth, i18n.language)}</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="size-4" />{t('admin.revenueTotal')}</div>
            <p className="mt-2 text-3xl font-extrabold text-primary">{formatPrice(data.revenue.allTime, i18n.language)}</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><CreditCard className="size-4" />{t('admin.teacherCommissions')}</div>
            <p className="mt-2 text-3xl font-extrabold text-accent-foreground">{formatPrice(data.revenue.teacherCommissionsOwed, i18n.language)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('admin.owed')}</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4" />{t('admin.adminCommissions')}</div>
            <p className="mt-2 text-3xl font-extrabold text-success">{formatPrice(data.revenue.adminCommissions, i18n.language)}</p>
            <p className="mt-1 text-xs text-muted-foreground">2% {t('admin.collected')}</p>
          </Card>
        </div>
      )}

      {/* Marketing admin: their own invite stats */}
      {!isSuperAdmin && data.myInvites && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Link2 className="size-4" />{t('admin.myInviteLinks')}</div>
            <p className="mt-2 text-3xl font-extrabold text-primary">{data.myInvites.count}</p>
          </Card>
          <Card className="gradient-brand p-6 text-primary-foreground">
            <div className="flex items-center gap-2 text-sm opacity-80"><CreditCard className="size-4" />{t('admin.myEarnings')}</div>
            <p className="mt-2 text-3xl font-extrabold">{formatPrice(data.myInvites.earned, i18n.language)}</p>
          </Card>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t('admin.totalStudents')} value={data.totals.students} icon={Users} index={0} />
        <StatCard label={t('admin.totalCourses')} value={data.totals.courses} icon={BookOpen} tone="primary" index={1} />
        <StatCard label={t('admin.activeEnrollments')} value={data.totals.activeEnrollments} icon={GraduationCap} tone="success" index={2} />
        <StatCard label={t('admin.pendingPayments')} value={data.totals.pendingPayments} icon={CreditCard} tone="destructive" index={3} />
        <StatCard label={t('admin.upcomingSessions')} value={data.totals.upcomingSessions} icon={CalendarClock} tone="accent" index={4} />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="mb-3 text-lg font-bold">{t('admin.quickActions')}</h3>
        <div className="flex flex-wrap gap-3">
          {isSuperAdmin && (
            <Button asChild>
              <Link to="/admin/courses"><Plus className="size-4" />{t('admin.addCourse')}</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/admin/enrollments"><CreditCard className="size-4" />{t('admin.confirmPayment')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/students"><Users className="size-4" />{t('admin.viewStudents')}</Link>
          </Button>
          {isSuperAdmin && (
            <Button variant="outline" asChild>
              <Link to="/admin/teachers"><ShieldCheck className="size-4" />{t('admin.manageTeachers')}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Recent enrollments */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t('admin.recentEnrollments')}</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/enrollments">{t('common.viewAll')}<ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" /></Link>
          </Button>
        </div>
        <Card className="overflow-hidden">
          {data.recentEnrollments.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{t('admin.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="p-3 text-start font-semibold">{t('admin.student')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.course')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.amount')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.status')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEnrollments.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium">{e.student?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{e.student?.phone}</p>
                      </td>
                      <td className="p-3">{e.course ? loc(e.course.title) : '—'}</td>
                      <td className="p-3 font-semibold">{formatPrice(e.amountPaid, i18n.language)}</td>
                      <td className="p-3"><Badge variant={statusVariant(e.paymentStatus)}>{e.paymentStatus}</Badge></td>
                      <td className="p-3 text-muted-foreground">{new Date(e.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
