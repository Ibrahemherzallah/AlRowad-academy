import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingUp, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { teacherApi, type TeacherEarnings } from '@/lib/teacher.api';

export default function TeacherEarningsPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [data, setData] = useState<TeacherEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.earnings().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-80 w-full" />;
  if (!data) return <p className="text-muted-foreground">{t('common.error')}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">{t('teacher.earnings')}</h2>
      <p className="text-muted-foreground">{t('teacher.commissionNote')}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="gradient-brand p-6 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm opacity-80"><TrendingUp className="size-4" />{t('teacher.totalEarned')}</div>
          <p className="mt-2 text-3xl font-extrabold">{formatPrice(data.lifetime, i18n.language)}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" />{t('teacher.pending')}</div>
          <p className="mt-2 text-3xl font-extrabold text-accent-foreground">{formatPrice(data.pending, i18n.language)}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="size-4" />{t('teacher.paid')}</div>
          <p className="mt-2 text-3xl font-extrabold text-success">{formatPrice(data.totalPaid, i18n.language)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-3 font-bold">{t('teacher.perCourse')}</div>
        {data.perCourse.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">{t('admin.noData')}</p>
        ) : (
          <div className="divide-y divide-border">
            {data.perCourse.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{p.course ? loc(p.course.title) : '—'}</p>
                  <p className="text-xs text-muted-foreground">{p.studentCount} {t('teacher.students')}</p>
                </div>
                <p className="text-lg font-extrabold text-primary">{formatPrice(p.earned, i18n.language)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
