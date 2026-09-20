import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalized } from '@/hooks/useLocalized';
import { adminApi } from '@/lib/admin.api';

interface ScheduleBlock {
  id: string;
  label: string;
  days: number[];
  startTime: string;
  endTime: string;
  room?: string;
  capacity?: number;
  enrolled: number;
  course: { title: { ar: string; en: string }; category: string; thumbnail?: string } | null;
}

const DAY_NAMES_AR = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

const COLORS = [
  'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200',
  'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200',
  'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:text-green-200',
  'bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-900/20 dark:text-purple-200',
  'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/20 dark:text-rose-200',
  'bg-cyan-50 border-cyan-200 text-cyan-900 dark:bg-cyan-900/20 dark:text-cyan-200',
  'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/20 dark:text-orange-200',
  'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-200',
];

export default function AdminSessionsPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    adminApi.timetable()
      .then((b) => setBlocks(b as ScheduleBlock[]))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }, []);

  // All unique course titles (for color assignment)
  const courseTitles = [...new Set(blocks.map((b) => b.course ? loc(b.course.title) : ''))].filter(Boolean);
  const colorMap = new Map(courseTitles.map((t, i) => [t, COLORS[i % COLORS.length]]));

  // All unique categories
  const categories = [...new Set(blocks.map((b) => b.course?.category).filter(Boolean))];

  const filtered = filterCategory
    ? blocks.filter((b) => b.course?.category === filterCategory)
    : blocks;

  // All unique time slots
  const timeSlots = [...new Set(filtered.map((b) => `${b.startTime}–${b.endTime}`))].sort();

  // Build day × slot matrix
  const matrix: Record<number, Record<string, ScheduleBlock[]>> = {};
  for (let d = 0; d < 7; d++) {
    matrix[d] = {};
    for (const slot of timeSlots) matrix[d][slot] = [];
  }
  for (const block of filtered) {
    const slot = `${block.startTime}–${block.endTime}`;
    for (const day of block.days) {
      matrix[day]?.[slot]?.push(block);
    }
  }

  // Only show days that have at least one block
  const activeDays = [0,1,2,3,4,5,6].filter((d) => timeSlots.some((s) => matrix[d][s].length > 0));

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-extrabold">{t('admin.timetable')}</h2>
        <div className="flex items-center gap-3">
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-48">
            <option value="">{t('admin.allCourses')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Badge variant="secondary">
            <CalendarClock className="size-3.5 me-1" />
            {filtered.length} حصة
          </Badge>
        </div>
      </div>

      {timeSlots.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <CalendarClock className="mx-auto size-10 mb-3 opacity-30" />
          لا توجد حصص مضافة بعد
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: `${timeSlots.length * 180 + 100}px` }}>
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="w-24 border-e border-border p-3 text-center font-bold text-muted-foreground sticky end-0 bg-muted/60">
                    اليوم / الوقت
                  </th>
                  {timeSlots.map((slot) => (
                    <th key={slot} className="border-e border-border p-3 text-center font-bold" dir="ltr">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeDays.map((d) => (
                  <tr key={d} className="border-b border-border last:border-0">
                    <td className="border-e border-border bg-muted/30 p-3 text-center font-semibold sticky end-0">
                      {DAY_NAMES_AR[d]}
                    </td>
                    {timeSlots.map((slot) => {
                      const cellBlocks = matrix[d][slot];
                      return (
                        <td key={slot} className="border-e border-border p-2 align-top min-w-[160px]">
                          {cellBlocks.length > 0 ? (
                            <div className="space-y-1">
                              {cellBlocks.map((block) => {
                                const title = block.course ? loc(block.course.title) : '—';
                                const color = colorMap.get(title) ?? COLORS[0];
                                return (
                                  <div key={block.id} className={`rounded-lg border p-2 ${color}`}>
                                    <p className="font-semibold text-xs leading-tight">{title}</p>
                                    {block.label && <p className="text-xs opacity-75 mt-0.5">{block.label}</p>}
                                    {block.room && <p className="text-xs opacity-60">{block.room}</p>}
                                    <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                                      <Users className="size-3" />
                                      {block.enrolled}{block.capacity ? `/${block.capacity}` : ''}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-full min-h-10 rounded-lg bg-muted/10" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Legend */}
      {courseTitles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {courseTitles.map((title) => (
            <div key={title} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${colorMap.get(title)}`}>
              <span className="size-2 rounded-full bg-current opacity-60" />
              {title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
