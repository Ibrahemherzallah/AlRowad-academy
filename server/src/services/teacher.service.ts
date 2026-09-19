import { Types } from 'mongoose';
import { Course } from '../models/Course.js';
import { ClassSchedule } from '../models/ClassSchedule.js';
import { Enrollment } from '../models/Enrollment.js';
import { TeacherCommission } from '../models/TeacherCommission.js';

/** Earnings summary for a teacher: accrued vs paid, and per-course breakdown. */
export async function teacherEarnings(teacherId: string | Types.ObjectId) {
  const tid = new Types.ObjectId(teacherId);

  const [totals, perCourse] = await Promise.all([
    TeacherCommission.aggregate([
      { $match: { teacherId: tid } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    TeacherCommission.aggregate([
      { $match: { teacherId: tid } },
      {
        $group: {
          _id: '$courseId',
          earned: { $sum: '$amount' },
          students: { $addToSet: '$studentId' },
        },
      },
    ]),
  ]);

  const accrued = totals.find((t) => t._id === 'accrued')?.total ?? 0;
  const paid = totals.find((t) => t._id === 'paid')?.total ?? 0;

  // Attach course titles.
  const courseIds = perCourse.map((p) => p._id);
  const courses = await Course.find({ _id: { $in: courseIds } }).select('title slug');
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));

  return {
    totalAccrued: accrued,
    totalPaid: paid,
    pending: accrued, // accrued-but-not-paid is what's owed
    lifetime: accrued + paid,
    perCourse: perCourse.map((p) => ({
      course: courseMap.get(String(p._id)) ?? null,
      earned: p.earned,
      studentCount: p.students.length,
    })),
  };
}

/**
 * Weekly schedule for a teacher: every class block across their courses,
 * grouped by weekday for a table view.
 */
export async function teacherSchedule(teacherId: string | Types.ObjectId) {
  const tid = new Types.ObjectId(teacherId);
  const schedules = await ClassSchedule.find({ teacherId: tid }).populate(
    'courseId',
    'title slug totalHours',
  );

  // Enrolled counts per schedule (students who picked that section).
  const scheduleIds = schedules.map((s) => s._id);
  const counts = await Enrollment.aggregate([
    { $match: { scheduleId: { $in: scheduleIds }, status: { $in: ['active', 'pending'] } } },
    { $group: { _id: '$scheduleId', n: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));

  const blocks = schedules.map((s) => ({
    id: s._id,
    label: s.label,
    course: s.courseId,
    days: s.days,
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
    capacity: s.capacity,
    enrolled: countMap.get(String(s._id)) ?? 0,
  }));

  // Group by weekday (0–6) for the table.
  const byDay: Record<number, typeof blocks> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const b of blocks) {
    for (const d of b.days) byDay[d].push(b);
  }
  // Sort each day's blocks by start time.
  for (const d of Object.keys(byDay)) {
    byDay[Number(d)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return { blocks, byDay };
}
