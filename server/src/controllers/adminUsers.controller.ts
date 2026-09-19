import type { Response } from 'express';
import { Types } from 'mongoose';
import { User, hashPassword } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { TeacherCommission } from '../models/TeacherCommission.js';
import { ensureLoyaltyAccount } from '../services/loyalty.service';
import { createReservation, recordPayment } from '../services/enrollment.service';
import { getSettings } from '../models/Settings.js';
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ok } from '../utils/apiResponse.js';
import type { AuthedRequest } from '../middleware/auth.js';

/* ---------------- Teachers ---------------- */

/** POST /api/admin/teachers — create a teacher account (admin only). */
export const createTeacher = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { name, phone, password, bio, specialty, commissionRate } = req.body as {
    name: string;
    phone: string;
    password: string;
    bio?: string;
    specialty?: string;
    commissionRate?: number;
  };

  const exists = await User.findOne({ phone });
  if (exists) throw ApiError.conflict('Phone already registered');

  const settings = await getSettings();
  const passwordHash = await hashPassword(password);
  const teacher = await User.create({
    name,
    phone,
    passwordHash,
    role: 'teacher',
    isVerified: true,
    bio: bio ?? '',
    specialty: specialty ?? '',
    commissionRate: commissionRate ?? settings.enrollment.defaultTeacherCommissionRate,
  });
  await ensureLoyaltyAccount(teacher._id.toString());
  return ok(res, teacher, 201);
});

/** GET /api/admin/teachers — list teachers with course + earnings counts. */
export const listTeachers = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const teachers = await User.find({ role: 'teacher' }).sort({ createdAt: -1 });

  const enriched = await Promise.all(
    teachers.map(async (t) => {
      const [courseCount, commissionAgg] = await Promise.all([
        Course.countDocuments({ teacherId: t._id }),
        TeacherCommission.aggregate([
          { $match: { teacherId: t._id } },
          { $group: { _id: '$status', total: { $sum: '$amount' } } },
        ]),
      ]);
      const accrued = commissionAgg.find((c) => c._id === 'accrued')?.total ?? 0;
      const paid = commissionAgg.find((c) => c._id === 'paid')?.total ?? 0;
      return {
        ...t.toObject(),
        courseCount,
        commissionOwed: accrued,
        commissionPaid: paid,
      };
    }),
  );
  return ok(res, enriched);
});

/** PATCH /api/admin/teachers/:id — update rate/bio/specialty. */
export const updateTeacher = catchAsync(async (req: AuthedRequest, res: Response) => {
  const teacher = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'teacher' },
    req.body,
    { new: true },
  );
  if (!teacher) throw ApiError.notFound('Teacher not found');
  return ok(res, teacher);
});

/* ---------------- Students ---------------- */

/** GET /api/admin/students — list students with enrollment/payment summary. */
export const listStudents = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
  const enriched = await Promise.all(
    students.map(async (s) => {
      const enrollments = await Enrollment.find({ studentId: s._id });
      const paid = enrollments.reduce((sum, e) => sum + e.amountPaid, 0);
      const owed = enrollments.reduce((sum, e) => sum + (e.totalAmount - e.amountPaid), 0);
      return {
        ...s.toObject(),
        enrollmentCount: enrollments.length,
        totalPaid: paid,
        totalOwed: owed,
      };
    }),
  );
  return ok(res, enriched);
});

/* ---------------- Connect student ⇄ course ---------------- */

/**
 * GET /api/admin/enrollments/price-preview?courseId=&amount=
 * Show what a student should pay and what remains — for the connect form.
 */
export const pricePreview = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { courseId, amount } = req.query as { courseId: string; amount?: string };
  const course = await Course.findById(courseId).select('price discountedPrice title');
  if (!course) throw ApiError.notFound('Course not found');

  const settings = await getSettings();
  const total =
    course.discountedPrice != null && course.discountedPrice < course.price
      ? course.discountedPrice
      : course.price;
  const minPay = Math.ceil((total * settings.enrollment.seatReservationMinPercent) / 100);
  const pay = amount ? Number(amount) : minPay;

  return ok(res, {
    total,
    minReservation: minPay,
    minPercent: settings.enrollment.seatReservationMinPercent,
    paying: pay,
    remaining: Math.max(0, total - pay),
  });
});

/**
 * POST /api/admin/enrollments/connect
 * Admin enrolls a student in a course and records how much they paid; the
 * service computes remaining balance and accrues teacher commission.
 */
export const connectStudent = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { studentId, courseId, amount, paymentMethod, scheduleId } = req.body as {
    studentId: string;
    courseId: string;
    amount: number;
    paymentMethod?: 'online' | 'bank_transfer' | 'cash';
    scheduleId?: string;
  };

  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) throw ApiError.notFound('Student not found');

  const enrollment = await createReservation({
    studentId,
    courseId,
    amount,
    paymentMethod: paymentMethod ?? 'cash',
    scheduleId: scheduleId ?? null,
  });
  return ok(res, enrollment, 201);
});

/** POST /api/admin/enrollments/:id/payment — record an additional payment. */
export const addPayment = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { amount, paymentMethod } = req.body as {
    amount: number;
    paymentMethod?: 'online' | 'bank_transfer' | 'cash';
  };
  const enrollment = await recordPayment(req.params.id, amount, paymentMethod);
  return ok(res, enrollment);
});

/** GET /api/admin/enrollments — all enrollments with student+course. */
export const listEnrollments = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  const filter = status ? { paymentStatus: status } : {};
  const enrollments = await Enrollment.find(filter)
    .populate('studentId', 'name phone')
    .populate('courseId', 'title slug')
    .sort({ createdAt: -1 });
  return ok(res, enrollments);
});

/* ---------------- Per-course stats ---------------- */

/** GET /api/admin/courses/:id/stats — revenue, teacher payout, discounts. */
export const courseStats = catchAsync(async (req: AuthedRequest, res: Response) => {
  const courseId = new Types.ObjectId(req.params.id);
  const course = await Course.findById(courseId).populate('teacherId', 'name commissionRate');
  if (!course) throw ApiError.notFound('Course not found');

  const enrollments = await Enrollment.find({ courseId }).populate('studentId', 'name phone');

  const revenue = enrollments.reduce((sum, e) => sum + e.amountPaid, 0);
  const outstanding = enrollments.reduce((sum, e) => sum + (e.totalAmount - e.amountPaid), 0);
  const discountsGiven = enrollments.reduce(
    (sum, e) => sum + e.offersApplied.reduce((s: number, o: { discountAmount?: number }) => s + (o.discountAmount || 0), 0),
    0,
  );

  const commissionAgg = await TeacherCommission.aggregate([
    { $match: { courseId } },
    { $group: { _id: '$status', total: { $sum: '$amount' } } },
  ]);
  const commissionOwed = commissionAgg.find((c) => c._id === 'accrued')?.total ?? 0;
  const commissionPaid = commissionAgg.find((c) => c._id === 'paid')?.total ?? 0;

  return ok(res, {
    course: { id: course._id, title: course.title, teacher: course.teacherId },
    students: enrollments.map((e) => ({
      student: e.studentId,
      paid: e.amountPaid,
      total: e.totalAmount,
      remaining: e.totalAmount - e.amountPaid,
      paymentStatus: e.paymentStatus,
      viaInvite: !!e.invitedVia,
    })),
    totals: {
      enrolled: enrollments.length,
      revenue,
      outstanding,
      discountsGiven,
      teacherCommissionOwed: commissionOwed,
      teacherCommissionPaid: commissionPaid,
    },
  });
});

/** POST /api/admin/teachers/:id/settle — mark accrued commissions as paid. */
export const settleCommissions = catchAsync(async (req: AuthedRequest, res: Response) => {
  const result = await TeacherCommission.updateMany(
    { teacherId: req.params.id, status: 'accrued' },
    { status: 'paid', paidAt: new Date() },
  );
  return ok(res, { settled: result.modifiedCount });
});
