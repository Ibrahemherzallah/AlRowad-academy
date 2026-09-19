import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { adminApi, type StudentRow } from '@/lib/admin.api';

export default function AdminStudentsPage() {
  const { t, i18n } = useTranslation();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    adminApi.students().then(setStudents).catch(() => setStudents([])).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(term) || s.phone.includes(term) || (s.city ?? '').toLowerCase().includes(term),
    );
  }, [students, q]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">{t('admin.navStudents')}</h2>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.searchStudents')} className="ps-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('admin.noData')}</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 text-start font-semibold">{t('admin.student')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.city')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.enrollments')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.totalPaid')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.totalOwed')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{s.phone}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">{s.city || '—'}</td>
                    <td className="p-3">{s.enrollmentCount}</td>
                    <td className="p-3 font-semibold text-success">{formatPrice(s.totalPaid, i18n.language)}</td>
                    <td className="p-3 text-accent-foreground">{formatPrice(s.totalOwed, i18n.language)}</td>
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
