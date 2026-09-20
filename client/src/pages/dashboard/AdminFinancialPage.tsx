import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, GraduationCap, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { adminApi } from '@/lib/admin.api';

interface FinancialData {
  totalRevenue: number;
  netRevenue: number;
  teacherOwed: number;
  teacherPaid: number;
  adminEarned: number;
  courseRevenues: {
    _id: string;
    revenue: number;
    count: number;
    title: { ar: string; en: string };
    category: string;
  }[];
}

export default function AdminFinancialPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.financialReport()
      .then((d) => setData(d as FinancialData))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-muted-foreground">{t('common.error')}</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-extrabold">{t('admin.financial')}</h2>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="gradient-brand p-6 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm opacity-80"><TrendingUp className="size-4" />{t('admin.revenueTotal')}</div>
          <p className="mt-2 text-3xl font-extrabold">{formatPrice(data.totalRevenue, i18n.language)}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="size-4" />{t('admin.netRevenue') || 'صافي الإيرادات'}</div>
          <p className="mt-2 text-3xl font-extrabold text-success">{formatPrice(data.netRevenue, i18n.language)}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><GraduationCap className="size-4" />{t('admin.teacherCommissions')}</div>
          <p className="mt-2 text-3xl font-extrabold text-accent-foreground">{formatPrice(data.teacherOwed, i18n.language)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('admin.owed')}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4" />{t('admin.adminCommissions')}</div>
          <p className="mt-2 text-3xl font-extrabold text-primary">{formatPrice(data.adminEarned, i18n.language)}</p>
          <p className="mt-1 text-xs text-muted-foreground">2% {t('admin.collected')}</p>
        </Card>
      </div>

      {/* Per-course revenue table */}
      <div>
        <h3 className="mb-4 text-xl font-bold">{t('admin.courseRevenues')}</h3>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 text-start font-semibold">{t('admin.course')}</th>
                  <th className="p-3 text-start font-semibold">{t('teacher.category')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.activeEnrollments')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.revenueTotal')}</th>
                  <th className="p-3 text-start font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {data.courseRevenues.map((c) => (
                  <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{c.title ? loc(c.title) : '—'}</td>
                    <td className="p-3 text-muted-foreground">{c.category}</td>
                    <td className="p-3">{c.count}</td>
                    <td className="p-3 font-bold text-success">{formatPrice(c.revenue, i18n.language)}</td>
                    <td className="p-3 text-muted-foreground">
                      {data.totalRevenue > 0 ? Math.round((c.revenue / data.totalRevenue) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
