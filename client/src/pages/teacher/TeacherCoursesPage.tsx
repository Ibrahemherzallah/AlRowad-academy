import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Trash2, GripVertical, ChevronDown, ChevronUp, ArrowLeft, Link2, Users, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { teacherApi } from '@/lib/teacher.api';
import { api } from '@/lib/api';
import type { Course } from '@/lib/types';

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 40);

interface ScheduleEntry { label: string; days: number[]; startTime: string; endTime: string; room: string; }
interface FaqEntry { question: string; answer: string; }

const DAY_NAMES_AR = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const DAY_NAMES_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/** Collapsible accordion section — defined OUTSIDE the page component so React
 *  never remounts it on re-render (which would kill input focus). */
function Section({
  id, title, open, onToggle, children,
}: {
  id: string; title: string; open: boolean; onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between p-4 font-bold"
      >
        {title}
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

export default function TeacherCoursesPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const dayNames = i18n.language === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string>('basic');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ ar: string; en: string }[]>([]);

  const [form, setForm] = useState({ titleAr: '', titleEn: '', descAr: '', descEn: '', category: '', totalHours: 40, price: 0, thumbnail: '' });
  const [properties, setProperties] = useState<string[]>(['']);
  const [faqs, setFaqs] = useState<FaqEntry[]>([{ question: '', answer: '' }]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      teacherApi.courses(),
      api.get<{ success: boolean; data: { ar: string; en: string }[] }>('/courses/categories').then((r) => r.data.data).catch(() => []),
    ]).then(([c, cats]) => {
      setCourses(c);
      setCategories(cats);
    }).catch(() => setCourses([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setF = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const addProp = () => setProperties((p) => [...p, '']);
  const setProp = (i: number, v: string) => setProperties((p) => p.map((x, j) => j === i ? v : x));
  const removeProp = (i: number) => setProperties((p) => p.filter((_, j) => j !== i));

  const addFaq = () => setFaqs((f) => [...f, { question: '', answer: '' }]);
  const setFaqField = (i: number, k: 'question' | 'answer', v: string) =>
    setFaqs((f) => f.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const removeFaq = (i: number) => setFaqs((f) => f.filter((_, j) => j !== i));

  const addSchedule = () => setSchedules((s) => [...s, { label: '', days: [], startTime: '09:00', endTime: '11:00', room: '' }]);
  const removeSchedule = (i: number) => setSchedules((s) => s.filter((_, j) => j !== i));
  const setSchedField = (i: number, k: keyof ScheduleEntry, v: unknown) =>
    setSchedules((s) => s.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const toggleDay = (si: number, d: number) =>
    setSchedules((s) => s.map((x, j) => j === si ? { ...x, days: x.days.includes(d) ? x.days.filter((dd) => dd !== d) : [...x.days, d] } : x));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.titleAr) { toast.error(t('validation.required')); return; }
    setSaving(true);
    try {
      const course = await teacherApi.createCourse({
        slug: slugify(form.titleEn || form.titleAr) + '-' + Date.now().toString(36).slice(-4),
        title: { ar: form.titleAr, en: form.titleEn || form.titleAr },
        description: { ar: form.descAr, en: form.descEn || form.descAr },
        category: form.category,
        totalHours: Number(form.totalHours),
        price: Number(form.price),
        thumbnail: form.thumbnail,
        properties: properties.filter((p) => p.trim()),
        faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
      });
      for (const s of schedules) {
        if (s.days.length > 0) {
          await teacherApi.createSchedule({ courseId: (course as { _id: string })._id, ...s });
        }
      }
      toast.success(t('teacher.createCourseSuccess'));
      setShowForm(false);
      setForm({ titleAr: '', titleEn: '', descAr: '', descEn: '', category: '', totalHours: 40, price: 0, thumbnail: '' });
      setProperties(['']); setFaqs([{ question: '', answer: '' }]); setSchedules([]);
      load();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || t('common.error'));
    }
    finally { setSaving(false); }
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
            <Section id="basic" title={`📋 المعلومات الأساسية`} open={openSection === "basic"} onToggle={setOpenSection}>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="titleAr" label={`${t('teacher.courseTitle')} (عربي) *`}>
                    <Input value={form.titleAr} onChange={(e) => setF('titleAr', e.target.value)} required />
                  </Field>
                  <Field id="titleEn" label={`${t('teacher.courseTitle')} (English)`}>
                    <Input value={form.titleEn} onChange={(e) => setF('titleEn', e.target.value)} dir="ltr" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="descAr" label={`${t('teacher.description')} (عربي)`}>
                    <Textarea value={form.descAr} onChange={(e) => setF('descAr', e.target.value)} rows={3} />
                  </Field>
                  <Field id="descEn" label={`${t('teacher.description')} (English)`}>
                    <Textarea value={form.descEn} onChange={(e) => setF('descEn', e.target.value)} rows={3} dir="ltr" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field id="category" label={t('teacher.category')}>
                    <Select value={form.category} onChange={(e) => setF('category', e.target.value)}>
                      <option value="">— اختر التصنيف —</option>
                      {categories.map((c, i) => (
                        <option key={i} value={c.ar}>{c.ar}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="totalHours" label={t('teacher.totalHours')}>
                    <Input type="number" min={1} value={form.totalHours} onChange={(e) => setF('totalHours', +e.target.value)} dir="ltr" />
                  </Field>
                  <Field id="price" label={t('teacher.price')}>
                    <Input type="number" min={0} value={form.price} onChange={(e) => setF('price', +e.target.value)} dir="ltr" />
                  </Field>
                </div>
              </div>
            </Section>

            <Section id="image" title={`🖼️ ${t('teacher.cover')}`} open={openSection === "image"} onToggle={setOpenSection}>
              <ImageUpload value={form.thumbnail} onChange={(url) => setF('thumbnail', url)} />
            </Section>

            <Section id="properties" title={`✅ ${t('teacher.properties')}`} open={openSection === "properties"} onToggle={setOpenSection}>
              <div className="space-y-2">
                {properties.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    <Input value={p} onChange={(e) => setProp(i, e.target.value)} placeholder={t('teacher.propertyPlaceholder')} className="flex-1" />
                    <button type="button" onClick={() => removeProp(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addProp}><Plus className="size-4" />{t('teacher.addProperty')}</Button>
              </div>
            </Section>

            <Section id="schedules" title={`🗓️ ${t('teacher.schedules')}`} open={openSection === "schedules"} onToggle={setOpenSection}>
              <div className="space-y-4">
                {schedules.length === 0 && <p className="text-sm text-muted-foreground">{t('teacher.noSchedules')}</p>}
                {schedules.map((s, i) => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">موعد {i + 1}</span>
                      <button type="button" onClick={() => removeSchedule(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                    </div>
                    <Field id={`slabel-${i}`} label={t('teacher.label')}>
                      <Input value={s.label} onChange={(e) => setSchedField(i, 'label', e.target.value)} placeholder="مثال: المجموعة الصباحية" />
                    </Field>
                    <Field id={`sdays-${i}`} label={t('teacher.days')}>
                      <div className="flex flex-wrap gap-2">
                        {dayNames.map((name, d) => (
                          <button key={d} type="button" onClick={() => toggleDay(i, d)}
                            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${s.days.includes(d) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>
                            {name}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field id={`sstart-${i}`} label={t('teacher.startTime')}>
                        <Input type="time" value={s.startTime} onChange={(e) => setSchedField(i, 'startTime', e.target.value)} dir="ltr" />
                      </Field>
                      <Field id={`send-${i}`} label={t('teacher.endTime')}>
                        <Input type="time" value={s.endTime} onChange={(e) => setSchedField(i, 'endTime', e.target.value)} dir="ltr" />
                      </Field>
                      <Field id={`sroom-${i}`} label={t('teacher.room')}>
                        <Input value={s.room} onChange={(e) => setSchedField(i, 'room', e.target.value)} />
                      </Field>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSchedule}><Plus className="size-4" />{t('teacher.addSchedule')}</Button>
              </div>
            </Section>

            <Section id="faqs" title={`❓ ${t('teacher.faqs')}`} open={openSection === "faqs"} onToggle={setOpenSection}>
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('teacher.faqQuestion')} {i + 1}</span>
                      <button type="button" onClick={() => removeFaq(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                    </div>
                    <Input value={f.question} onChange={(e) => setFaqField(i, 'question', e.target.value)} placeholder={t('teacher.faqQuestion')} />
                    <Textarea value={f.answer} onChange={(e) => setFaqField(i, 'answer', e.target.value)} placeholder={t('teacher.faqAnswer')} rows={2} />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addFaq}><Plus className="size-4" />{t('teacher.addFaq')}</Button>
              </div>
            </Section>

            <Button type="submit" disabled={saving} size="lg">{saving ? t('common.saving') : t('common.save')}</Button>
          </form>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('admin.noData')}</Card>
      ) : selectedCourseId ? (
        <CourseDetailPanel
          courseId={selectedCourseId}
          onBack={() => setSelectedCourseId(null)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card
              key={c._id}
              className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
              onClick={() => setSelectedCourseId(c._id)}
            >
              <div className="aspect-video bg-muted">
                {c.thumbnail ? <img src={c.thumbnail} alt="" className="size-full object-cover" /> : (
                  <div className="grid size-full place-items-center gradient-brand text-3xl font-bold text-primary-foreground/80">{loc(c.title).charAt(0)}</div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{c.category}</Badge>
                  <Badge variant={c.status === 'published' ? 'success' : 'muted'}>{c.status === 'published' ? t('teacher.published') : t('teacher.draft')}</Badge>
                </div>
                <h3 className="truncate font-bold">{loc(c.title)}</h3>
                {c.totalHours ? <p className="mt-1 text-xs text-muted-foreground">{c.totalHours} {t('teacher.hours')}</p> : null}
                <p className="mt-3 text-lg font-extrabold text-primary">{formatPrice(c.price, i18n.language)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Course Detail Panel                                                  */
/* ------------------------------------------------------------------ */
interface LessonRow { title: string; videoUrl: string; isFreePreview: boolean; }

function CourseDetailPanel({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();

  const [data, setData] = useState<{ course: Course; students: { id: string; student: { name: string; phone: string; city?: string } | null; amountPaid: number; totalAmount: number; paymentStatus: string; createdAt: string; }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonRow[]>([{ title: '', videoUrl: '', isFreePreview: false }]);
  const [savingLessons, setSavingLessons] = useState(false);
  const [tab, setTab] = useState<'lessons' | 'students'>('lessons');

  useEffect(() => {
    teacherApi.getCourse(courseId)
      .then((d) => {
        setData(d);
        const existing = d.course.curriculum?.[0]?.lessons ?? [];
        if (existing.length > 0) {
          setLessons(existing.map((l: { title: string; videoUrl?: string; isFreePreview?: boolean }) => ({ title: l.title, videoUrl: l.videoUrl ?? '', isFreePreview: l.isFreePreview ?? false })));
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [courseId]);

  const addLesson = () => setLessons((l) => [...l, { title: '', videoUrl: '', isFreePreview: false }]);
  const removeLesson = (i: number) => setLessons((l) => l.filter((_, j) => j !== i));
  const setLesson = (i: number, k: keyof LessonRow, v: unknown) =>
    setLessons((l) => l.map((x, j) => j === i ? { ...x, [k]: v } : x));

  const saveLessons = async () => {
    const valid = lessons.filter((l) => l.title.trim());
    if (valid.length === 0) { toast.error(t('validation.required')); return; }
    setSavingLessons(true);
    try {
      await teacherApi.updateLessons(courseId, valid);
      toast.success(t('common.save'));
    } catch { toast.error(t('common.error')); }
    finally { setSavingLessons(false); }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-muted-foreground">{t('common.error')}</p>;

  const { course, students } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold truncate">{loc(course.title)}</h2>
          <p className="text-sm text-muted-foreground">{course.category} · {course.totalHours} {t('teacher.hours')}</p>
        </div>
        <Badge variant={course.status === 'published' ? 'success' : 'muted'}>
          {course.status === 'published' ? t('teacher.published') : t('teacher.draft')}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['lessons', 'students'] as const).map((tab_) => (
          <button
            key={tab_}
            onClick={() => setTab(tab_)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === tab_ ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab_ === 'lessons' ? `📹 الدروس (${lessons.length})` : `👥 الطلاب (${students.length})`}
          </button>
        ))}
      </div>

      {/* Lessons tab */}
      {tab === 'lessons' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">أضف روابط الدروس المسجّلة (Zoom، Google Drive، YouTube unlisted...)</p>
          {lessons.map((l, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">درس {i + 1}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={l.isFreePreview} onChange={(e) => setLesson(i, 'isFreePreview', e.target.checked)} />
                    <Eye className="size-3" /> معاينة مجانية
                  </label>
                  <button onClick={() => removeLesson(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <Field id={`ltitle-${i}`} label="عنوان الدرس">
                <Input value={l.title} onChange={(e) => setLesson(i, 'title', e.target.value)} placeholder="مثال: درس 1 — مقدمة للتسويق الرقمي" />
              </Field>
              <Field id={`lurl-${i}`} label="رابط الفيديو">
                <div className="relative">
                  <Link2 className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input value={l.videoUrl} onChange={(e) => setLesson(i, 'videoUrl', e.target.value)} dir="ltr" className="text-start ps-9" placeholder="https://..." />
                </div>
              </Field>
            </Card>
          ))}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={addLesson}>
              <Plus className="size-4" /> إضافة درس
            </Button>
            <Button onClick={saveLessons} disabled={savingLessons}>
              {savingLessons ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {/* Students tab */}
      {tab === 'students' && (
        <div>
          {students.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              <Users className="mx-auto size-8 mb-2" />
              لا يوجد طلاب مسجّلون بعد
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-3 text-start font-semibold">{t('admin.student')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.paid')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.remaining')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium">{s.student?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{s.student?.phone}</p>
                      </td>
                      <td className="p-3 font-semibold text-success">{formatPrice(s.amountPaid, i18n.language)}</td>
                      <td className="p-3 text-accent-foreground">{formatPrice(s.totalAmount - s.amountPaid, i18n.language)}</td>
                      <td className="p-3">
                        <Badge variant={s.paymentStatus === 'paid' ? 'success' : s.paymentStatus === 'partial' ? 'accent' : 'muted'}>
                          {s.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
