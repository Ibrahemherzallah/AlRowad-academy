import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, CheckCircle2, Archive, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { adminApi } from '@/lib/admin.api';
import type { Course } from '@/lib/types';

export default function AdminCoursesPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.courses().then(setCourses).catch(() => setCourses([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await adminApi.updateCourse(id, { status });
      toast.success(t('common.save'));
      load();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy('');
    }
  };

  const statusBadge = (s: string) =>
    s === 'published' ? 'success' : s === 'draft' ? 'muted' : s === 'coming_soon' ? 'accent' : 'secondary';
  const statusLabel = (s: string) =>
    s === 'published' ? t('admin.published') : s === 'draft' ? t('admin.draft') : s === 'coming_soon' ? t('admin.comingSoon') : t('admin.archived');

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">{t('admin.courseList')}</h2>

      {courses.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('admin.noData')}</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 text-start font-semibold">{t('admin.course')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.price')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.status')}</th>
                  <th className="p-3 text-start font-semibold">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{loc(c.title)}</p>
                      <p className="text-xs text-muted-foreground">{c.category}{c.totalHours ? ` · ${c.totalHours}${t('teacher.hours')}` : ''}</p>
                    </td>
                    <td className="p-3 font-semibold">{formatPrice(c.price, i18n.language)}</td>
                    <td className="p-3"><Badge variant={statusBadge(c.status)}>{statusLabel(c.status)}</Badge></td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {c.status !== 'published' && (
                          <Button size="sm" variant="outline" disabled={busy === c._id} onClick={() => setStatus(c._id, 'published')}>
                            <CheckCircle2 className="size-4" />{t('admin.publish')}
                          </Button>
                        )}
                        {c.status === 'published' && (
                          <Button size="sm" variant="outline" disabled={busy === c._id} onClick={() => setStatus(c._id, 'draft')}>
                            <Clock className="size-4" />{t('admin.unpublish')}
                          </Button>
                        )}
                        {c.status !== 'archived' && (
                          <Button size="sm" variant="ghost" disabled={busy === c._id} onClick={() => setStatus(c._id, 'archived')}>
                            <Archive className="size-4" />
                          </Button>
                        )}
                        <Button size="sm" asChild>
                          <Link to={`/admin/courses/${c._id}/stats`}>
                            <BarChart3 className="size-4" />{t('admin.viewStats')}
                          </Link>
                        </Button>
                      </div>
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
