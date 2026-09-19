import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, MapPin, Users, X } from 'lucide-react';
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

      {/* Weekly timetable grid */}
      {!schedule || schedule.blocks.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('teacher.noClasses')}</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: '700px' }}>
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  {/* Day column header */}
                  <th className="w-24 border-e border-border p-3 text-center font-bold text-muted-foreground">
                    {t('admin.date')}
                  </th>
                  {/* Time slot headers — collect all unique slots */}
                  {Array.from(
                    new Set(
                      schedule.blocks.map((b) => `${b.startTime}–${b.endTime}`)
                    )
                  ).sort().map((slot) => (
                    <th key={slot} className="border-e border-border p-3 text-center font-bold" dir="ltr">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayNames.map((name, d) => {
                  const blocks = schedule.byDay[d] ?? [];
                  const allSlots = Array.from(
                    new Set(schedule.blocks.map((b) => `${b.startTime}–${b.endTime}`))
                  ).sort();

                  // colour palette per course
                  const COLORS = [
                    'bg-primary/10 border-primary/30 text-primary',
                    'bg-accent/15 border-accent/30 text-accent-foreground',
                    'bg-success/10 border-success/30 text-success',
                    'bg-destructive/10 border-destructive/30 text-destructive',
                    'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
                    'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
                  ];

                  return (
                    <tr key={d} className="border-b border-border last:border-0">
                      {/* Day label */}
                      <td className="border-e border-border bg-muted/30 p-3 text-center font-semibold">
                        {name}
                      </td>
                      {allSlots.map((slot) => {
                        const block = blocks.find(
                          (b) => `${b.startTime}–${b.endTime}` === slot
                        );
                        // pick a stable colour based on the course index
                        const courseIdx = block
                          ? schedule.blocks.findIndex((b) => b.id === block.id) % COLORS.length
                          : 0;

                        return (
                          <td key={slot} className="border-e border-border p-2 align-top">
                            {block ? (
                              <div
                                className={`group relative rounded-lg border p-2 ${COLORS[courseIdx]}`}
                              >
                                <p className="font-semibold leading-tight">
                                  {block.course ? loc(block.course.title) : '—'}
                                </p>
                                {block.label && (
                                  <p className="mt-0.5 text-xs opacity-75">{block.label}</p>
                                )}
                                {block.room && (
                                  <p className="mt-0.5 flex items-center gap-1 text-xs opacity-75">
                                    <MapPin className="size-3" />{block.room}
                                  </p>
                                )}
                                <p className="mt-1 flex items-center gap-1 text-xs opacity-75">
                                  <Users className="size-3" />{block.enrolled} {t('teacher.enrolled')}
                                </p>
                                <button
                                  onClick={() => remove(block.id)}
                                  className="absolute end-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                  aria-label="delete"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-full min-h-12 rounded-lg bg-muted/20" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
