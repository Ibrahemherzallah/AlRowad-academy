import type { Response } from 'express';
import { Types } from 'mongoose';
import { User, hashPassword } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { TeacherCommission } from '../models/TeacherCommission.js';
import { InviteLink } from '../models/InviteLink.js';
import { ensureLoyaltyAccount } from '../services/loyalty.service.js';
import { createReservation, recordPayment } from '../services/enrollment.service.js';
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

/** POST /api/admin/admins — create a marketing admin account (superadmin only). */
export const createAdmin = catchAsync(async (req: AuthedRequest, res: Response) => {
  if (req.user!.role !== 'superadmin') throw ApiError.forbidden('Only superadmin can create admin accounts');
  const { name, phone, password } = req.body as { name: string; phone: string; password: string };
  const exists = await User.findOne({ phone });
  if (exists) throw ApiError.conflict('Phone already registered');
  const passwordHash = await hashPassword(password);
  const admin = await User.create({ name, phone, passwordHash, role: 'admin', isVerified: true });
  return ok(res, admin, 201);
});

/** GET /api/admin/admins — list all marketing admin accounts (superadmin only). */
export const listAdmins = catchAsync(async (req: AuthedRequest, res: Response) => {
  if (req.user!.role !== 'superadmin') throw ApiError.forbidden('Only superadmin can view admin accounts');
  const admins = await User.find({ role: 'admin' }).select('name phone createdAt').sort({ createdAt: -1 });
  // Enrich with invite stats
  const enriched = await Promise.all(admins.map(async (a) => {
    const [inviteCount, earned] = await Promise.all([
      InviteLink.countDocuments({ inviterId: a._id, inviterRole: 'admin' }),
      TeacherCommission.aggregate([
        { $match: { teacherId: a._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    return { ...a.toObject(), inviteCount, earned: earned[0]?.total ?? 0 };
  }));
  return ok(res, enriched);
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
  const { studentId, courseId, amount, paymentMethod, scheduleId, inviteCode } = req.body as {
    studentId: string;
    courseId: string;
    amount: number;
    paymentMethod?: 'online' | 'bank_transfer' | 'cash';
    scheduleId?: string;
    inviteCode?: string;
  };

  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) throw ApiError.notFound('Student not found');

  const enrollment = await createReservation({
    studentId,
    courseId,
    amount,
    paymentMethod: paymentMethod ?? 'cash',
    scheduleId: scheduleId ?? null,
    inviteCode: inviteCode ?? null,
    skipMinimum: true, // admin can set any amount
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

/**
 * POST /api/admin/invites — admin creates an invite link for any course.
 * Inviter is the admin; rate is 2% (tracked, marked paid immediately as academy revenue).
 */
export const adminCreateInvite = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { courseId } = req.body as { courseId: string };
  const course = await Course.findById(courseId).select('_id status title');
  if (!course) throw ApiError.notFound('Course not found');

  // Reuse an existing active admin link for this course if present.
  let invite = await InviteLink.findOne({
    inviterId: req.user!.id,
    courseId,
    inviterRole: 'admin',
    isActive: true,
  });
  if (!invite) {
    invite = await InviteLink.create({
      inviterId: req.user!.id,
      inviterRole: 'admin',
      courseId,
    });
  }

  const { env } = await import('../config/env.js');
  return ok(res, { ...invite.toObject(), url: `${env.CLIENT_URL}/join/${invite.code}` }, 201);
});

/**
 * GET /api/admin/enrollments/:id/payments — all payment history for one enrollment.
 */
export const enrollmentPayments = catchAsync(async (req: AuthedRequest, res: Response) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('studentId', 'name phone')
    .populate('courseId', 'title slug price');
  if (!enrollment) throw ApiError.notFound('Enrollment not found');

  const commissions = await TeacherCommission.find({ enrollmentId: req.params.id }).sort({ createdAt: 1 });

  return ok(res, {
    enrollment: {
      id: enrollment._id,
      student: enrollment.studentId,
      course: enrollment.courseId,
      amountPaid: enrollment.amountPaid,
      totalAmount: enrollment.totalAmount,
      remaining: enrollment.totalAmount - enrollment.amountPaid,
      paymentStatus: enrollment.paymentStatus,
      paymentMethod: enrollment.paymentMethod,
      commissionedAmount: enrollment.commissionedAmount,
      createdAt: enrollment.createdAt,
    },
    commissions,
  });
});

/* ─────────────────── Categories ─────────────────── */

/** GET /api/admin/categories */
export const listCategories = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const settings = await getSettings();
  return ok(res, settings.categories ?? []);
});

/** POST /api/admin/categories */
export const addCategory = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { ar, en, icon } = req.body as { ar: string; en: string; icon?: string };
  const settings = await getSettings();
  (settings.categories as { ar: string; en: string; icon?: string }[]).push({ ar: ar.trim(), en: en.trim(), icon: icon?.trim() ?? '' });
  await (settings as unknown as { save: () => Promise<void> }).save();
  return ok(res, settings.categories, 201);
});

/** DELETE /api/admin/categories/:index */
export const deleteCategory = catchAsync(async (req: AuthedRequest, res: Response) => {
  const idx = parseInt(req.params.index, 10);
  const settings = await getSettings();
  const cats = settings.categories as { ar: string; en: string; icon?: string }[];
  if (idx < 0 || idx >= cats.length) throw ApiError.notFound('Category not found');
  cats.splice(idx, 1);
  await (settings as unknown as { save: () => Promise<void> }).save();
  return ok(res, cats);
});

/* ─────────────────── Discounts ─────────────────── */

/** GET /api/admin/discounts */
export const listDiscounts = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const { Discount } = await import('../models/Discount.js');
  const discounts = await Discount.find().sort({ createdAt: -1 });
  return ok(res, discounts);
});

/** POST /api/admin/discounts */
export const createDiscount = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { Discount } = await import('../models/Discount.js');
  const discount = await Discount.create(req.body);
  // Apply to matching courses immediately
  const { Course } = await import('../models/Course.js');
  if (discount.scope === 'all') {
    await Course.updateMany({}, { discountedPrice: null }); // will be computed on the fly
  } else if (discount.scope === 'category' && discount.category) {
    await Course.updateMany({ category: discount.category }, { discountedPrice: null });
  } else if (discount.scope === 'courses' && discount.courseIds?.length) {
    await Course.updateMany({ _id: { $in: discount.courseIds } }, { discountedPrice: null });
  }
  return ok(res, discount, 201);
});

/** PATCH /api/admin/discounts/:id — toggle active or update */
export const updateDiscount = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { Discount } = await import('../models/Discount.js');
  const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!discount) throw ApiError.notFound('Discount not found');
  return ok(res, discount);
});

/** DELETE /api/admin/discounts/:id */
export const deleteDiscount = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { Discount } = await import('../models/Discount.js');
  await Discount.findByIdAndDelete(req.params.id);
  return ok(res, { deleted: true });
});

/* ─────────────────── Contact messages ─────────────────── */

/** GET /api/admin/contact — list all messages newest first */
export const listMessages = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const { ContactMessage } = await import('../models/ContactMessage.js');
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  return ok(res, messages);
});

/** PATCH /api/admin/contact/:id — update status */
export const updateMessage = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { ContactMessage } = await import('../models/ContactMessage.js');
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!msg) throw ApiError.notFound('Message not found');
  return ok(res, msg);
});

/* ─────────────────── Financial report ─────────────────── */

/** GET /api/admin/financial — revenue breakdown per course + commissions */
export const financialReport = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const [courseRevenues, teacherCommissions, adminCommissions] = await Promise.all([
    Enrollment.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'partial'] } } },
      { $group: { _id: '$courseId', revenue: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      { $project: { revenue: 1, count: 1, title: '$course.title', category: '$course.category' } },
      { $sort: { revenue: -1 } },
    ]),
    TeacherCommission.aggregate([
      { $group: { _id: '$status', total: { $sum: '$amount' } } },
    ]),
    TeacherCommission.aggregate([
      { $match: { rate: 0.02 } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalRevenue = courseRevenues.reduce((s, c) => s + c.revenue, 0);
  const teacherOwed = teacherCommissions.find((c) => c._id === 'accrued')?.total ?? 0;
  const teacherPaid = teacherCommissions.find((c) => c._id === 'paid')?.total ?? 0;
  const adminEarned = adminCommissions[0]?.total ?? 0;
  const netRevenue = totalRevenue - teacherOwed;

  return ok(res, { totalRevenue, netRevenue, teacherOwed, teacherPaid, adminEarned, courseRevenues });
});

/* ─────────────────── All sessions timetable ─────────────────── */

/** GET /api/admin/timetable — all schedules across all courses */
export const timetable = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const { ClassSchedule } = await import('../models/ClassSchedule.js');
  const schedules = await ClassSchedule.find()
    .populate('courseId', 'title category thumbnail teacherId')
    .sort({ startTime: 1 });

  const enrollmentCounts = await Enrollment.aggregate([
    { $match: { status: { $in: ['active', 'pending'] } } },
    { $group: { _id: '$courseId', n: { $sum: 1 } } },
  ]);
  const countMap = new Map(enrollmentCounts.map((e) => [String(e._id), e.n]));

  return ok(res, schedules.map((s) => ({
    id: s._id,
    label: s.label,
    days: s.days,
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
    capacity: s.capacity,
    course: s.courseId,
    enrolled: countMap.get(String((s.courseId as { _id?: unknown })?._id ?? s.courseId)) ?? 0,
  })));
});
