import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, LinkIcon } from 'lucide-react';
import { Card } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Select } from '@/components/ui/select.tsx';
import { Field } from '@/components/ui/field.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { toast } from '@/components/ui/toast.tsx';
import { useLocalized } from '@/hooks/useLocalized.ts';
import { formatPrice } from '@/lib/utils.ts';
import { adminApi, type StudentRow, type PricePreview } from '@/lib/admin.api.ts';
import type { Course } from '@/lib/types.ts';

export default function AdminEnrollmentsPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [amount, setAmount] = useState(0);
  const [preview, setPreview] = useState<PricePreview | null>(null);

  useEffect(() => {
    Promise.all([adminApi.students(), adminApi.courses()])
      .then(([s, c]) => {
        setStudents(s);
        setCourses(c.filter((x) => x.status === 'published'));
      })
      .finally(() => setLoading(false));
  }, []);

  // Refresh price preview when course or amount changes.
  useEffect(() => {
    if (!courseId) { setPreview(null); return; }
    adminApi.pricePreview(courseId, amount || undefined).then((p) => {
      setPreview(p);
      if (!amount) setAmount(p.minReservation);
    }).catch(() => setPreview(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, amount]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentId || !courseId) { toast.error(t('common.error')); return; }
    setSaving(true);
    try {
      await adminApi.connectStudent({ studentId, courseId, amount, paymentMethod: 'cash' });
      toast.success(t('admin.connected'));
      setStudentId(''); setCourseId(''); setAmount(0); setPreview(null);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">{t('admin.connectStudent')}</h2>

      <Card className="max-w-2xl p-6">
        <form onSubmit={submit} className="space-y-5">
          <Field id="student" label={t('admin.selectStudent')}>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">—</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.phone})</option>
              ))}
            </Select>
          </Field>

          <Field id="course" label={t('admin.selectCourse')}>
            <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setAmount(0); }} required>
              <option value="">—</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{loc(c.title)} — {formatPrice(c.price, i18n.language)}</option>
              ))}
            </Select>
          </Field>

          {preview && (
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-4 text-center text-sm">
              <div>
                <p className="text-muted-foreground">{t('admin.shouldPay')}</p>
                <p className="font-bold">{formatPrice(preview.total, i18n.language)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('join.minReserve')} ({preview.minPercent}%)</p>
                <p className="font-bold text-primary">{formatPrice(preview.minReservation, i18n.language)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('admin.remaining')}</p>
                <p className="font-bold text-accent-foreground">{formatPrice(preview.remaining, i18n.language)}</p>
              </div>
            </div>
          )}

          <Field id="amount" label={t('admin.amountPaid')}>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(+e.target.value)} dir="ltr" className="text-end" />
          </Field>

          <Button type="submit" disabled={saving || !studentId || !courseId}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
            {t('admin.connect')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
