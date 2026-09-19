import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { teacherApi } from '@/lib/teacher.api';
import type { LocalizedString } from '@/lib/types';

interface Row {
  id: string;
  student: { name: string; phone: string; city?: string } | null;
  course: { title: LocalizedString } | null;
  amountPaid: number;
  totalAmount: number;
  paymentStatus: string;
  viaInvite: boolean;
  createdAt: string;
}

export default function TeacherStudentsPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.students().then((r) => setRows(r as Row[])).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);

  const statusVariant = (s: string) =>
    s === 'paid' ? 'success' : s === 'partial' ? 'accent' : 'muted';

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">{t('teacher.navStudents')}</h2>

      {rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('admin.noData')}</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 text-start font-semibold">{t('admin.student')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.course')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.paid')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.paymentStatus')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.date')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{r.student?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{r.student?.phone}</p>
                    </td>
                    <td className="p-3">
                      {r.course ? loc(r.course.title) : '—'}
                      {r.viaInvite && <Badge variant="secondary" className="ms-2">{t('admin.joinedVia')}</Badge>}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatPrice(r.amountPaid, i18n.language)}
                      <span className="text-xs text-muted-foreground"> / {formatPrice(r.totalAmount, i18n.language)}</span>
                    </td>
                    <td className="p-3"><Badge variant={statusVariant(r.paymentStatus)}>{r.paymentStatus}</Badge></td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
