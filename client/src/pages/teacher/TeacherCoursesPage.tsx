import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { teacherApi } from '@/lib/teacher.api';
import type { Course } from '@/lib/types';

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 40);

export default function TeacherCoursesPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titleAr: '', titleEn: '', descAr: '', descEn: '',
    category: '', totalHours: 40, price: 0, thumbnail: '',
  });

  const load = () => {
    setLoading(true);
    teacherApi.courses().then(setCourses).catch(() => setCourses([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teacherApi.createCourse({
        slug: slugify(form.titleEn || form.titleAr) + '-' + Date.now().toString(36).slice(-4),
        title: { ar: form.titleAr, en: form.titleEn || form.titleAr },
        description: { ar: form.descAr, en: form.descEn || form.descAr },
        category: form.category,
        totalHours: Number(form.totalHours),
        price: Number(form.price),
        thumbnail: form.thumbnail,
      });
      toast.success(t('teacher.createCourseSuccess'));
      setShowForm(false);
      setForm({ titleAr: '', titleEn: '', descAr: '', descEn: '', category: '', totalHours: 40, price: 0, thumbnail: '' });
      load();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">{t('teacher.myCourses')}</h2>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {t('teacher.addCourse')}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="titleAr" label={`${t('teacher.courseTitle')} (ع)`}>
                <Input value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} required />
              </Field>
              <Field id="titleEn" label={`${t('teacher.courseTitle')} (EN)`}>
                <Input value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} dir="ltr" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="descAr" label={`${t('teacher.description')} (ع)`}>
                <Textarea value={form.descAr} onChange={(e) => setForm((f) => ({ ...f, descAr: e.target.value }))} rows={2} required />
              </Field>
              <Field id="descEn" label={`${t('teacher.description')} (EN)`}>
                <Textarea value={form.descEn} onChange={(e) => setForm((f) => ({ ...f, descEn: e.target.value }))} rows={2} dir="ltr" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="category" label={t('teacher.category')}>
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required />
              </Field>
              <Field id="totalHours" label={t('teacher.totalHours')}>
                <Input type="number" min={1} value={form.totalHours} onChange={(e) => setForm((f) => ({ ...f, totalHours: +e.target.value }))} dir="ltr" />
              </Field>
              <Field id="price" label={t('teacher.price')}>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: +e.target.value }))} dir="ltr" required />
              </Field>
            </div>
            <Field id="thumbnail" label={t('teacher.cover')}>
              <Input value={form.thumbnail} onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))} dir="ltr" placeholder="https://..." />
            </Field>
            <Button type="submit" disabled={saving}>{t('common.save')}</Button>
          </form>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('admin.noData')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card key={c._id} className="overflow-hidden">
              <div className="aspect-video bg-muted">
                {c.thumbnail ? (
                  <img src={c.thumbnail} alt="" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center gradient-brand text-3xl font-bold text-primary-foreground/80">
                    {loc(c.title).charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{c.category}</Badge>
                  <Badge variant={c.status === 'published' ? 'success' : 'muted'}>
                    {c.status === 'published' ? t('teacher.published') : t('teacher.draft')}
                  </Badge>
                </div>
                <h3 className="truncate font-bold">{loc(c.title)}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {c.totalHours ? <span className="flex items-center gap-1"><Clock className="size-3.5" />{c.totalHours} {t('teacher.hours')}</span> : null}
                </div>
                <p className="mt-3 text-lg font-extrabold text-primary">{formatPrice(c.price, i18n.language)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
