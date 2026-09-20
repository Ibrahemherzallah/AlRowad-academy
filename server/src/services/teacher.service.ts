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

  // Count enrolled students per schedule block:
  // - Students who picked a specific scheduleId → counted only for that block
  // - Students with no scheduleId (admin-connected) → counted for ALL blocks of their course
  const scheduleIds = schedules.map((s) => s._id);

  const [bySchedule, byCourse] = await Promise.all([
    // Students with a specific schedule choice
    Enrollment.aggregate([
      { $match: { scheduleId: { $in: scheduleIds }, status: { $in: ['active', 'pending'] } } },
      { $group: { _id: '$scheduleId', n: { $sum: 1 } } },
    ]),
    // Students with no schedule (admin-connected) — group by course
    Enrollment.aggregate([
      {
        $match: {
          scheduleId: null,
          status: { $in: ['active', 'pending'] },
          courseId: { $in: schedules.map((s) => {
              const cid = s.courseId as { _id?: Types.ObjectId } | Types.ObjectId | null;
              return (cid as { _id?: Types.ObjectId })?._id ?? cid;
            }).filter(Boolean) },
        },
      },
      { $group: { _id: '$courseId', n: { $sum: 1 } } },
    ]),
  ]);

  const byScheduleMap = new Map(bySchedule.map((c) => [String(c._id), c.n as number]));
  const byCourseMap = new Map(byCourse.map((c) => [String(c._id), c.n as number]));

  const blocks = schedules.map((s) => {
    const cid = s.courseId as { _id?: Types.ObjectId } | Types.ObjectId | null;
    const courseIdStr = String((cid as { _id?: Types.ObjectId })?._id ?? cid);
    const scheduleCount = byScheduleMap.get(String(s._id)) ?? 0;
    const unassignedCount = byCourseMap.get(courseIdStr) ?? 0;
    return {
      id: s._id,
      label: s.label,
      course: s.courseId,
      days: s.days,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      capacity: s.capacity,
      enrolled: scheduleCount + unassignedCount,
    };
  });

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
