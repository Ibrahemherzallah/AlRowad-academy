import type { Response } from 'express';
import { Types } from 'mongoose';
import { Enrollment } from '@/models';
import { Course } from '@/models';
import { User } from '@/models';
import { Session } from '@/models';
import { LoyaltyVoucher } from '@/models';
import { getSettings } from '@/models';
import { ensureLoyaltyAccount } from '@/services/loyalty.service';
import { catchAsync } from '@/utils/catchAsync';
import { ok } from '@/utils/apiResponse';
import type { AuthedRequest } from '@/middleware/auth';

/**
 * GET /api/dashboard/student
 * Everything the student landing dashboard needs in one call: enrolled
 * courses with progress, loyalty widget, upcoming session, referral stats.
 */
export const studentOverview = catchAsync(async (req: AuthedRequest, res: Response) => {
  const studentId = new Types.ObjectId(req.user!.id);
  const settings = await getSettings();

  const [user, enrollments, loyalty, activeVouchers, nextSession, referralCount] =
    await Promise.all([
      User.findById(studentId),
      Enrollment.find({ studentId })
        .populate('courseId', 'title slug thumbnail category status')
        .sort({ createdAt: -1 }),
      ensureLoyaltyAccount(studentId),
      LoyaltyVoucher.find({ studentId, status: 'active' }),
      Session.findOne({
        studentId,
        status: 'scheduled',
        scheduledAt: { $gte: new Date() },
      }).sort({ scheduledAt: 1 }),
      User.countDocuments({ referredBy: studentId }),
    ]);

  const now = new Date();
  const courses = enrollments.map((e) => {
    const course = e.courseId as unknown as {
      _id: Types.ObjectId;
      title: { ar: string; en: string };
      slug: string;
      thumbnail?: string;
      category: string;
    } | null;
    const expired = e.accessEndDate ? now > e.accessEndDate : false;
    const derivedStatus =
      e.status === 'active' && expired ? 'expired' : e.status;
    return {
      enrollmentId: e._id,
      course,
      status: derivedStatus,
      paymentStatus: e.paymentStatus,
      accessEndDate: e.accessEndDate,
      // Progress is computed in the My Courses endpoint; keep the widget light.
    };
  });

  const stats = {
    enrolledCount: enrollments.length,
    activeCount: enrollments.filter((e) => e.status === 'active').length,
  };

  const loyaltyWidget = {
    pointsBalance: loyalty.pointsBalance,
    threshold: settings.loyalty.threshold,
    lifetimePointsEarned: loyalty.lifetimePointsEarned,
    voucherReady: activeVouchers.length > 0,
    activeVouchers: activeVouchers.map((v) => ({
      code: v.code,
      discountPercent: v.discountPercent,
      expiresAt: v.expiresAt,
    })),
  };

  const referral = {
    code: user?.referralCode ?? '',
    invited: referralCount,
    converted: await Enrollment.countDocuments({
      studentId: { $in: await referredStudentIds(studentId) },
      status: { $in: ['active', 'pending'] },
    }),
  };

  return ok(res, {
    name: user?.name ?? '',
    stats,
    courses,
    loyalty: loyaltyWidget,
    upcomingSession: nextSession,
    referral,
  });
});

/** Helper: ids of students referred by this user. */
async function referredStudentIds(studentId: Types.ObjectId): Promise<Types.ObjectId[]> {
  const refs = await User.find({ referredBy: studentId }).select('_id');
  return refs.map((r) => r._id);
}

/**
 * GET /api/admin/dashboard
 * Admin overview: totals, revenue (month/all-time), active enrollments,
 * pending manual payments, upcoming sessions.
 */
export const adminOverview = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    activeEnrollments,
    pendingPayments,
    upcomingSessions,
    totalCourses,
    revenueAgg,
    revenueMonthAgg,
    recentEnrollments,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Enrollment.countDocuments({ status: 'active' }),
    Enrollment.countDocuments({ paymentStatus: { $in: ['pending', 'partial'] } }),
    Session.countDocuments({ status: 'scheduled', scheduledAt: { $gte: new Date() } }),
    Course.countDocuments(),
    Enrollment.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    Enrollment.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'partial'] }, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    Enrollment.find()
      .populate('studentId', 'name phone')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .limit(6),
  ]);

  return ok(res, {
    totals: {
      students: totalStudents,
      courses: totalCourses,
      activeEnrollments,
      pendingPayments,
      upcomingSessions,
    },
    revenue: {
      allTime: revenueAgg[0]?.total ?? 0,
      thisMonth: revenueMonthAgg[0]?.total ?? 0,
    },
    recentEnrollments: recentEnrollments.map((e) => ({
      id: e._id,
      student: e.studentId,
      course: e.courseId,
      status: e.status,
      paymentStatus: e.paymentStatus,
      amountPaid: e.amountPaid,
      createdAt: e.createdAt,
    })),
  });
});

/**
 * GET /api/dashboard/loyalty
 * Full loyalty view for the student points page: balance, threshold,
 * lifetime, history log, and active vouchers.
 */
export const studentLoyalty = catchAsync(async (req: AuthedRequest, res: Response) => {
  const studentId = new Types.ObjectId(req.user!.id);
  const settings = await getSettings();
  const [account, vouchers] = await Promise.all([
    ensureLoyaltyAccount(studentId),
    LoyaltyVoucher.find({ studentId, status: 'active' }).sort({ issuedAt: -1 }),
  ]);

  return ok(res, {
    pointsBalance: account.pointsBalance,
    threshold: settings.loyalty.threshold,
    lifetimePointsEarned: account.lifetimePointsEarned,
    pointsPerEnrollment: settings.loyalty.pointsPerEnrollment,
    pointsPerReferral: settings.loyalty.pointsPerReferral,
    voucherDiscountPercent: settings.loyalty.voucherDiscountPercent,
    history: [...account.history].reverse().slice(0, 50),
    vouchers: vouchers.map((v) => ({
      code: v.code,
      discountPercent: v.discountPercent,
      expiresAt: v.expiresAt,
    })),
  });
});

/**
 * GET /api/dashboard/courses/:courseId
 * Full curriculum for a course the student is enrolled in, with lesson ids so
 * the player can request signed URLs. Verifies active enrollment first.
 */
export const studentCourseDetail = catchAsync(async (req: AuthedRequest, res: Response) => {
  const studentId = new Types.ObjectId(req.user!.id);
  const courseId = req.params.courseId;

  const enrollment = await Enrollment.findOne({ studentId, courseId, status: 'active' });
  if (!enrollment) throw new (await import('../utils/apiError.js')).ApiError(403, 'Not enrolled');

  const course = await Course.findById(courseId).select('title description curriculum thumbnail');
  if (!course) throw new (await import('../utils/apiError.js')).ApiError(404, 'Course not found');

  // Strip raw video URLs; the player fetches signed URLs per lesson.
  const curriculum = course.curriculum.map((s: { title: string; lessons: { _id: unknown; title: string; duration: number; isFreePreview: boolean }[] }) => ({
    title: s.title,
    lessons: s.lessons.map((l) => ({
      _id: l._id,
      title: l.title,
      duration: l.duration,
      isFreePreview: l.isFreePreview,
    })),
  }));

  const now = new Date();
  return ok(res, {
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    curriculum,
    accessEndDate: enrollment.accessEndDate,
    expired: enrollment.accessEndDate ? now > enrollment.accessEndDate : false,
  });
});
