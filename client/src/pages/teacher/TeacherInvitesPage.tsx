import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Plus, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import { teacherApi, type InviteLink } from '@/lib/teacher.api';
import type { Course, LocalizedString } from '@/lib/types';

export default function TeacherInvitesPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState('');

  const load = () => {
    Promise.all([teacherApi.invites(), teacherApi.courses()])
      .then(([inv, c]) => {
        setInvites(inv);
        setCourses(c);
        if (c[0]) setSelected(c[0]._id);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!selected) return;
    try {
      await teacherApi.createInvite(selected);
      toast.success(t('common.save'));
      load();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const copy = async (inv: InviteLink) => {
    await navigator.clipboard.writeText(inv.url);
    setCopiedId(inv._id);
    toast.success(t('teacher.copied'));
    setTimeout(() => setCopiedId(''), 2000);
  };

  if (loading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">{t('teacher.invites')}</h2>
        <p className="mt-1 text-muted-foreground">{t('teacher.inviteHint')}</p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Select value={selected} onChange={(e) => setSelected(e.target.value)} className="sm:max-w-xs">
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{loc(c.title)}</option>
          ))}
        </Select>
        <Button onClick={create}>
          <Plus className="size-4" />
          {t('teacher.createInvite')}
        </Button>
      </Card>

      {invites.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('admin.noData')}</Card>
      ) : (
        <div className="space-y-3">
          {invites.map((inv) => (
            <Card key={inv._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">
                  {inv.courseId && typeof inv.courseId === 'object' ? loc((inv.courseId as { title: LocalizedString }).title) : '—'}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Link2 className="size-4" />
                  <span className="truncate" dir="ltr">{inv.url}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{inv.uses} {t('teacher.uses')}</Badge>
                <Button size="sm" variant="outline" onClick={() => copy(inv)}>
                  {copiedId === inv._id ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  {t('teacher.copyLink')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
