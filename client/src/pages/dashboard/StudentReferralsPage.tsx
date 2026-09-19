import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Plus, Link2, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import {
  myStudentInvites,
  createStudentInvite,
  type StudentInvite,
} from '@/lib/enrollment.api';
import { fetchStudentOverview } from '@/lib/dashboard.api';
import type { LocalizedString } from '@/lib/types';

interface EnrolledCourse {
  _id: string;
  title: LocalizedString;
}

export default function StudentReferralsPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [invites, setInvites] = useState<StudentInvite[]>([]);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState('');

  const load = () => {
    Promise.all([myStudentInvites(), fetchStudentOverview()])
      .then(([inv, overview]) => {
        setInvites(inv);
        const enrolled = overview.courses
          .filter((c) => c.course)
          .map((c) => ({ _id: c.course!._id, title: c.course!.title }));
        setCourses(enrolled);
        if (enrolled[0]) setSelected(enrolled[0]._id);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!selected) return;
    try {
      await createStudentInvite(selected);
      toast.success(t('common.save'));
      load();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const copy = async (inv: StudentInvite) => {
    await navigator.clipboard.writeText(inv.url);
    setCopiedId(inv._id);
    toast.success(t('dashboard.copied'));
    setTimeout(() => setCopiedId(''), 2000);
  };

  if (loading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">{t('dashboard.inviteFriends')}</h2>
        <p className="mt-1 text-muted-foreground">{t('dashboard.inviteRule')}</p>
      </div>

      {courses.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('dashboard.noCoursesYet')}</Card>
      ) : (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium">{t('dashboard.createInviteFor')}</label>
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{loc(c.title)}</option>
              ))}
            </Select>
          </div>
          <Button onClick={create}>
            <Plus className="size-4" />
            {t('teacher.createInvite')}
          </Button>
        </Card>
      )}

      <div>
        <h3 className="mb-3 font-bold">{t('dashboard.myInvites')}</h3>
        {invites.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">{t('dashboard.noInvites')}</Card>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => (
              <Card key={inv._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {typeof inv.courseId === 'object' ? loc((inv.courseId as { title: LocalizedString }).title) : '—'}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link2 className="size-4" />
                    <span className="truncate" dir="ltr">{inv.url}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1"><Users className="size-3" />{inv.uses}</Badge>
                  <Button size="sm" variant="outline" onClick={() => copy(inv)}>
                    {copiedId === inv._id ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                    {t('dashboard.copyLink')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
