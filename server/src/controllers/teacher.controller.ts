import type { Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.js';
import { ClassSchedule } from '../models/ClassSchedule.js';
import { InviteLink } from '../models/InviteLink.js';
import { Enrollment } from '../models/Enrollment.js';
import { User } from '../models/User.js';
import { teacherEarnings, teacherSchedule } from '../services/teacher.service';
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ok } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import type { AuthedRequest } from '../middleware/auth.js';

/* ---------------- Courses (owned) ---------------- */

/** GET /api/teacher/courses — this teacher's own courses. */
export const myCourses = catchAsync(async (req: AuthedRequest, res: Response) => {
  const courses = await Course.find({ teacherId: req.user!.id }).sort({ createdAt: -1 });
  return ok(res, courses);
});

/** POST /api/teacher/courses */
export const createCourse = catchAsync(async (req: AuthedRequest, res: Response) => {
  const exists = await Course.findOne({ slug: req.body.slug });
  if (exists) throw ApiError.conflict('A course with this slug already exists');

  const teacher = await User.findById(req.user!.id).select('name');
  const course = await Course.create({
    ...req.body,
    teacherId: req.user!.id,
    instructorName: teacher?.name ?? '',
    status: 'draft', // teacher creates as draft; admin publishes
  });
  return ok(res, course, 201);
});

/** Assert the course exists and is owned by the requesting teacher. */
async function ownedCourse(teacherId: string, courseId: string) {
  const course = await Course.findOne({ _id: courseId, teacherId });
  if (!course) throw ApiError.notFound('Course not found or not yours');
  return course;
}

/** PATCH /api/teacher/courses/:id */
export const updateCourse = catchAsync(async (req: AuthedRequest, res: Response) => {
  await ownedCourse(req.user!.id, req.params.id);
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  return ok(res, course);
});

/* ---------------- Schedules ---------------- */

/** GET /api/teacher/schedule — weekly table across all courses. */
export const mySchedule = catchAsync(async (req: AuthedRequest, res: Response) => {
  const data = await teacherSchedule(req.user!.id);
  return ok(res, data);
});

/** POST /api/teacher/schedules */
export const createSchedule = catchAsync(async (req: AuthedRequest, res: Response) => {
  await ownedCourse(req.user!.id, req.body.courseId);
  const schedule = await ClassSchedule.create({
    ...req.body,
    teacherId: req.user!.id,
  });
  return ok(res, schedule, 201);
});

/** PATCH /api/teacher/schedules/:id */
export const updateSchedule = catchAsync(async (req: AuthedRequest, res: Response) => {
  const schedule = await ClassSchedule.findOne({ _id: req.params.id, teacherId: req.user!.id });
  if (!schedule) throw ApiError.notFound('Schedule not found');
  Object.assign(schedule, req.body);
  await schedule.save();
  return ok(res, schedule);
});

/** DELETE /api/teacher/schedules/:id */
export const deleteSchedule = catchAsync(async (req: AuthedRequest, res: Response) => {
  const schedule = await ClassSchedule.findOneAndDelete({
    _id: req.params.id,
    teacherId: req.user!.id,
  });
  if (!schedule) throw ApiError.notFound('Schedule not found');
  return ok(res, { message: 'Deleted' });
});

/* ---------------- Invite links ---------------- */

/** GET /api/teacher/invites — teacher's invite links (with joined counts). */
export const myInvites = catchAsync(async (req: AuthedRequest, res: Response) => {
  const invites = await InviteLink.find({ inviterId: req.user!.id, inviterRole: 'teacher' })
    .populate('courseId', 'title slug')
    .sort({ createdAt: -1 });

  const withUrls = invites.map((i) => ({
    ...i.toObject(),
    url: `${env.CLIENT_URL}/join/${i.code}`,
  }));
  return ok(res, withUrls);
});

/** POST /api/teacher/invites — create an invite link for one of my courses. */
export const createInvite = catchAsync(async (req: AuthedRequest, res: Response) => {
  await ownedCourse(req.user!.id, req.body.courseId);
  // Reuse an existing active link if present.
  let invite = await InviteLink.findOne({
    inviterId: req.user!.id,
    courseId: req.body.courseId,
    inviterRole: 'teacher',
    isActive: true,
  });
  if (!invite) {
    invite = await InviteLink.create({
      inviterId: req.user!.id,
      inviterRole: 'teacher',
      courseId: req.body.courseId,
    });
  }
  return ok(res, { ...invite.toObject(), url: `${env.CLIENT_URL}/join/${invite.code}` }, 201);
});

/* ---------------- Earnings & students ---------------- */

/** GET /api/teacher/earnings — commission summary + per-course breakdown. */
export const myEarnings = catchAsync(async (req: AuthedRequest, res: Response) => {
  const data = await teacherEarnings(req.user!.id);
  return ok(res, data);
});

/** GET /api/teacher/students — students enrolled in this teacher's courses. */
export const myStudents = catchAsync(async (req: AuthedRequest, res: Response) => {
  const courseIds = await Course.find({ teacherId: req.user!.id }).distinct('_id');
  const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
    .populate('studentId', 'name phone city')
    .populate('courseId', 'title slug')
    .sort({ createdAt: -1 });

  return ok(
    res,
    enrollments.map((e) => ({
      id: e._id,
      student: e.studentId,
      course: e.courseId,
      amountPaid: e.amountPaid,
      totalAmount: e.totalAmount,
      paymentStatus: e.paymentStatus,
      viaInvite: !!e.invitedVia,
      createdAt: e.createdAt,
    })),
  );
});

/** GET /api/teacher/overview — dashboard summary numbers. */
export const overview = catchAsync(async (req: AuthedRequest, res: Response) => {
  const teacherId = new Types.ObjectId(req.user!.id);
  const courseIds = await Course.find({ teacherId }).distinct('_id');

  const [courseCount, studentCount, earnings, sched] = await Promise.all([
    Course.countDocuments({ teacherId }),
    Enrollment.countDocuments({ courseId: { $in: courseIds }, status: { $in: ['active', 'pending'] } }),
    teacherEarnings(teacherId),
    teacherSchedule(teacherId),
  ]);

  return ok(res, {
    courseCount,
    studentCount,
    earnings,
    upcomingBlocks: sched.blocks.length,
  });
});
