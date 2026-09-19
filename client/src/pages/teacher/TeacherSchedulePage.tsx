import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Clock, MapPin, Users, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import { teacherApi, type TeacherSchedule } from '@/lib/teacher.api';
import type { Course } from '@/lib/types';

export default function TeacherSchedulePage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const dayNames = t('teacher.days_short', { returnObjects: true }) as string[];

  const [schedule, setSchedule] = useState<TeacherSchedule | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    courseId: '',
    label: '',
    days: [] as number[],
    startTime: '09:00',
    endTime: '11:00',
    room: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([teacherApi.schedule(), teacherApi.courses()])
      .then(([s, c]) => {
        setSchedule(s);
        setCourses(c);
        if (c[0] && !form.courseId) setForm((f) => ({ ...f, courseId: c[0]._id }));
      })
      .catch(() => setSchedule(null))
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const toggleDay = (d: number) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
    }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.courseId || form.days.length === 0) {
      toast.error(t('common.error'));
      return;
    }
    setSaving(true);
    try {
      await teacherApi.createSchedule(form);
      toast.success(t('common.save'));
      setShowForm(false);
      setForm((f) => ({ ...f, label: '', days: [], room: '' }));
      load();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await teacherApi.deleteSchedule(id);
      load();
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">{t('teacher.schedule')}</h2>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {t('teacher.addClass')}
        </Button>
      </div>

      {/* Add-class form */}
      {showForm && (
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="courseId" label={t('teacher.navCourses')}>
                <Select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{loc(c.title)}</option>
                  ))}
                </Select>
              </Field>
              <Field id="label" label={t('teacher.label')}>
                <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="المجموعة الصباحية" />
              </Field>
            </div>

            <Field id="days" label={t('teacher.days')}>
              <div className="flex flex-wrap gap-2">
                {dayNames.map((name, d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.days.includes(d)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="startTime" label={t('teacher.startTime')}>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} dir="ltr" />
              </Field>
              <Field id="endTime" label={t('teacher.endTime')}>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} dir="ltr" />
              </Field>
              <Field id="room" label={t('teacher.room')}>
                <Input value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} />
              </Field>
            </div>

            <Button type="submit" disabled={saving}>{t('common.save')}</Button>
          </form>
        </Card>
      )}

      {/* Weekly table */}
      {!schedule || schedule.blocks.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('teacher.noClasses')}</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dayNames.map((name, d) => {
            const blocks = schedule.byDay[d] ?? [];
            if (blocks.length === 0) return null;
            return (
              <Card key={d} className="overflow-hidden">
                <div className="border-b border-border bg-muted/50 px-4 py-2.5 font-bold">{name}</div>
                <div className="divide-y divide-border">
                  {blocks.map((b) => (
                    <div key={`${b.id}-${d}`} className="group flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{b.course ? loc(b.course.title) : '—'}</p>
                        {b.label && <p className="text-xs text-muted-foreground">{b.label}</p>}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1" dir="ltr">
                            <Clock className="size-3.5" />
                            {b.startTime}–{b.endTime}
                          </span>
                          {b.room && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{b.room}</span>}
                          <span className="flex items-center gap-1"><Users className="size-3.5" />{b.enrolled} {t('teacher.enrolled')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => remove(b.id)}
                        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        aria-label="delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
