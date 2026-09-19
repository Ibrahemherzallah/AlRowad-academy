import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer } from '@/components/dashboard/VideoPlayer';
import { useLocalized } from '@/hooks/useLocalized';
import { cn } from '@/lib/utils';
import { fetchStudentOverview } from '@/lib/dashboard.api';
import { fetchStudentCourse, type StudentCourseDetail, type StudentLesson } from '@/lib/dashboard.api';
import type { LocalizedString } from '@/lib/types';

interface EnrolledCourse {
  _id: string;
  title: LocalizedString;
  thumbnail?: string;
  category: string;
  status: string;
}

export default function StudentCoursesPage() {
  const { t } = useTranslation();
  const loc = useLocalized();

  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentCourseDetail | null>(null);
  const [activeLesson, setActiveLesson] = useState<StudentLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchStudentOverview()
      .then((o) => {
        const list = o.courses
          .filter((c) => c.course && c.status === 'active')
          .map((c) => ({ ...c.course!, status: c.status }));
        setCourses(list);
        if (list[0]) setActiveCourseId(list[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeCourseId) return;
    setDetailLoading(true);
    fetchStudentCourse(activeCourseId)
      .then((d) => {
        setDetail(d);
        const first = d.curriculum[0]?.lessons[0] ?? null;
        setActiveLesson(first);
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [activeCourseId]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  if (courses.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <PlayCircle className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">{t('dashboard.noCoursesYet')}</p>
        <Button asChild><Link to="/courses">{t('dashboard.browseCourses')}</Link></Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">{t('dashboard.myCourses')}</h2>

      {/* Course chips */}
      {courses.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <button
              key={c._id}
              onClick={() => setActiveCourseId(c._id)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                activeCourseId === c._id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted',
              )}
            >
              {loc(c.title)}
            </button>
          ))}
        </div>
      )}

      {detailLoading || !detail ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Player */}
          <div className="lg:col-span-2">
            {activeLesson ? (
              <>
                <VideoPlayer key={activeLesson._id} lessonId={activeLesson._id} poster={detail.thumbnail} />
                <h3 className="mt-4 text-lg font-bold">{activeLesson.title}</h3>
              </>
            ) : (
              <div className="grid aspect-video place-items-center rounded-xl bg-muted text-muted-foreground">
                {t('dashboard.selectLesson')}
              </div>
            )}
          </div>

          {/* Lesson list */}
          <Card className="h-fit overflow-hidden">
            <div className="border-b border-border px-4 py-3 font-bold">{t('dashboard.lessons')}</div>
            <div className="max-h-[32rem] overflow-y-auto">
              {detail.curriculum.map((section, si) => (
                <div key={si}>
                  <div className="bg-muted/50 px-4 py-2 text-sm font-semibold">{section.title}</div>
                  {section.lessons.map((lesson) => {
                    const isActive = activeLesson?._id === lesson._id;
                    return (
                      <button
                        key={lesson._id}
                        onClick={() => setActiveLesson(lesson)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-start text-sm transition-colors',
                          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                        )}
                      >
                        {isActive ? <PlayCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />}
                        <span className="flex-1 truncate">{lesson.title}</span>
                        {lesson.isFreePreview && <Badge variant="success">{t('dashboard.freePreview')}</Badge>}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />{Math.round(lesson.duration / 60)}{t('dashboard.min')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
