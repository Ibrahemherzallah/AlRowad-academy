import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, Wallet, CalendarClock, Edit2, Check, X } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { teacherApi, type TeacherOverview } from '@/lib/teacher.api';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

export default function TeacherOverviewPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<TeacherOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.overview().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }
  if (!data) return <p className="text-muted-foreground">{t('common.error')}</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold md:text-3xl">
          {t('dashboard.welcomeBack')}، {user?.name} 👋
        </h2>
        <p className="mt-1 text-muted-foreground">{t('teacher.commissionNote')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('teacher.myCourses')} value={data.courseCount} icon={BookOpen} index={0} />
        <StatCard label={t('teacher.navStudents')} value={data.studentCount} icon={Users} tone="success" index={1} />
        <StatCard label={t('teacher.pending')} value={formatPrice(data.earnings.pending, i18n.language)} icon={Wallet} tone="accent" index={2} />
        <StatCard label={t('teacher.navSchedule')} value={data.upcomingBlocks} icon={CalendarClock} index={3} />
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-bold">{t('teacher.earnings')}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">{t('teacher.totalEarned')}</p>
            <p className="text-2xl font-extrabold text-primary">{formatPrice(data.earnings.lifetime, i18n.language)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">{t('teacher.pending')}</p>
            <p className="text-2xl font-extrabold text-accent-foreground">{formatPrice(data.earnings.pending, i18n.language)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">{t('teacher.paid')}</p>
            <p className="text-2xl font-extrabold text-success">{formatPrice(data.earnings.totalPaid, i18n.language)}</p>
          </div>
        </div>
      </Card>

      <BioEditor />
    </div>
  );
}

/** Inline bio/specialty editor shown on the teacher overview. */
function BioEditor() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/teacher/profile', { bio, specialty });
      toast.success(t('common.save'));
      setEditing(false);
    } catch { toast.error(t('common.error')); }
    finally { setSaving(false); }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t('courses.instructorBio')}</h3>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Edit2 className="size-4" />{t('admin.bio')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}><Check className="size-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="size-4" /></Button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder={t('admin.specialty')} />
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="نبذة عنك تظهر في صفحة الدورة..." />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{user?.name} — {t('admin.bio')}</p>
      )}
    </Card>
  );
}
