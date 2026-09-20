import { Types } from 'mongoose';
import { Enrollment, type IEnrollment } from '../models/Enrollment.js';
import { Course, type ICourse } from '../models/Course.js';
import { User } from '../models/User.js';
import { InviteLink } from '../models/InviteLink.js';
import { ClassSchedule } from '../models/ClassSchedule.js';
import { TeacherCommission } from '../models/TeacherCommission.js';
import { getSettings } from '../models/Settings.js';
import { awardEnrollmentPoints, awardReferralPoints } from '../services/loyalty.service.js';
import { notifyStudent } from '../services/notify.service.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import type { PaymentMethod } from '../types/index.js';

interface CreateEnrollmentInput {
  studentId: string | Types.ObjectId;
  courseId: string | Types.ObjectId;
  amount: number;
  paymentMethod?: PaymentMethod;
  inviteCode?: string | null;
  scheduleId?: string | null;
  /** When true (admin only) skip the 30% minimum — any amount including 0 is valid. */
  skipMinimum?: boolean;
}

/** Effective (possibly discounted) course price. */
function coursePrice(course: ICourse): number {
  return course.discountedPrice != null && course.discountedPrice < course.price
      ? course.discountedPrice
      : course.price;
}

/**
 * Accrue teacher commission for a newly-received payment.
 * Commission is ONLY accrued when the student joined via a teacher invite link.
 * (Not for every course that happens to have a teacher.)
 */
async function accrueCommission(
    enrollment: IEnrollment,
    course: ICourse,
    paymentAmount: number,
): Promise<void> {
  if (paymentAmount <= 0) return;

  // Only accrue if the student used a teacher invite link.
  if (!enrollment.invitedVia) {
    logger.info(`Commission skipped: no invitedVia on enrollment ${enrollment._id}`);
    return;
  }

  const invite = await InviteLink.findById(enrollment.invitedVia).select('inviterRole inviterId');
  if (!invite) {
    logger.warn(`Commission skipped: invite ${enrollment.invitedVia} not found`);
    return;
  }
  if (invite.inviterRole !== 'teacher') {
    logger.info(`Commission skipped: inviterRole=${invite.inviterRole}, not teacher`);
    return;
  }

  // The teacher must own this course.
  const teacherId = invite.inviterId;
  if (!teacherId) return;

  const teacher = await User.findById(teacherId).select('commissionRate');
  if (!teacher) return;

  const settings = await getSettings();
  const rate = teacher.commissionRate ?? settings.enrollment.defaultTeacherCommissionRate;
  const amount = Math.round(paymentAmount * rate * 100) / 100;
  if (amount <= 0) return;

  await TeacherCommission.create({
    teacherId,
    courseId: course._id,
    studentId: enrollment.studentId,
    enrollmentId: enrollment._id,
    inviteLinkId: enrollment.invitedVia,
    basisAmount: paymentAmount,
    rate,
    amount,
  });

  enrollment.commissionedAmount += paymentAmount;
  logger.info(`Commission accrued: ${amount} to teacher ${teacherId} (${rate * 100}% of ${paymentAmount})`);
}

/** Derive paymentStatus from amounts. */
function derivePaymentStatus(paid: number, total: number): IEnrollment['paymentStatus'] {
  if (paid <= 0) return 'pending';
  if (paid >= total) return 'paid';
  return 'partial';
}

/**
 * Create a seat-reservation enrollment. The student pays at least the minimum
 * reservation percentage (default 30%); access to recorded videos unlocks on a
 * valid reservation. Handles invite attribution (teacher commission / referral
 * points) and awards enrollment points.
 */
export async function createReservation(input: CreateEnrollmentInput): Promise<IEnrollment> {
  const studentId = new Types.ObjectId(input.studentId);
  const course = await Course.findById(input.courseId);
  if (!course) throw ApiError.notFound('Course not found');
  if (course.status !== 'published') throw ApiError.badRequest('Course is not open for enrollment');

  // Block duplicate active/pending enrollment.
  const existing = await Enrollment.findOne({
    studentId,
    courseId: course._id,
    status: { $in: ['pending', 'active'] },
  });
  if (existing) throw ApiError.conflict('Already enrolled in this course');

  const settings = await getSettings();
  const total = coursePrice(course);
  const minPay = Math.ceil((total * settings.enrollment.seatReservationMinPercent) / 100);

  if (!input.skipMinimum && input.amount < minPay) {
    throw ApiError.badRequest(
        `Minimum reservation is ${settings.enrollment.seatReservationMinPercent}% (${minPay})`,
    );
  }
  if (input.amount > total) throw ApiError.badRequest('Amount exceeds course price');

  // Resolve invite link (must belong to this course).
  let invitedVia: Types.ObjectId | null = null;
  let invite = null;
  if (input.inviteCode) {
    invite = await InviteLink.findOne({ code: input.inviteCode.toUpperCase(), isActive: true });
    if (!invite) {
      throw ApiError.badRequest('رمز الدعوة غير صالح أو منتهي الصلاحية');
    }
    if (String(invite.courseId) !== String(course._id)) {
      throw ApiError.badRequest('رمز الدعوة لا ينتمي لهذه الدورة');
    }
    invitedVia = invite._id;
    logger.info(`Invite resolved: code=${input.inviteCode} role=${invite.inviterRole} inviter=${invite.inviterId}`);
  }

  // Validate chosen schedule belongs to this course.
  let scheduleId: Types.ObjectId | null = null;
  if (input.scheduleId) {
    const sched = await ClassSchedule.findOne({ _id: input.scheduleId, courseId: course._id });
    if (sched) scheduleId = sched._id;
  }

  const now = new Date();
  const accessEnd = course.endDate
      ? new Date(course.endDate.getTime() + course.accessBufferWeeks * 7 * 86_400_000)
      : null;

  const enrollment = await Enrollment.create({
    studentId,
    courseId: course._id,
    status: 'active', // reservation grants access
    paymentStatus: derivePaymentStatus(input.amount, total),
    paymentMethod: input.paymentMethod ?? 'cash',
    amountPaid: input.amount,
    totalAmount: total,
    accessStartDate: now,
    accessEndDate: accessEnd,
    invitedVia,
    scheduleId,
  });

  // Commission on this first payment.
  await accrueCommission(enrollment, course, input.amount);
  await enrollment.save();

  // Invite bookkeeping + rewards.
  if (invite) {
    invite.uses += 1;
    await invite.save();
    if (invite.inviterRole === 'student') {
      // Student invite → referral points to the inviter
      const friend = await User.findById(studentId).select('name');
      await awardReferralPoints(invite.inviterId, friend?.name ?? 'صديق');
    } else if (invite.inviterRole === 'admin') {
      // Admin invite → 2% commission tracked as academy revenue (no external payout)
      // We record it but mark immediately as paid since admin = academy
      if (input.amount > 0) {
        const adminCommission = Math.round(input.amount * 0.02 * 100) / 100;
        await TeacherCommission.create({
          teacherId: invite.inviterId, // admin user id
          courseId: course._id,
          studentId,
          enrollmentId: enrollment._id,
          inviteLinkId: invite._id,
          basisAmount: input.amount,
          rate: 0.02,
          amount: adminCommission,
          status: 'paid', // admin commission is academy revenue, mark paid immediately
          paidAt: new Date(),
        });
        logger.info(`Admin invite commission: ${adminCommission} (2% of ${input.amount})`);
      }
    }
    // teacher invite → commission already handled via accrueCommission above
  }

  // +5 enrollment points to the student (once).
  if (!enrollment.loyaltyAwarded) {
    await awardEnrollmentPoints(studentId, course._id, course.title.ar, course.loyaltyPointsOverride);
    enrollment.loyaltyAwarded = true;
    await enrollment.save();
  }

  // Notify student.
  const student = await User.findById(studentId).select('phone name');
  if (student) {
    const remaining = total - input.amount;
    await notifyStudent(student, {
      whatsapp:
          remaining > 0
              ? `✅ تم حجز مقعدك في ${course.title.ar}. دفعت ${input.amount} والمتبقّي ${remaining}.`
              : `✅ تم تسجيلك بالكامل في ${course.title.ar}. أهلاً بك!`,
    });
  }

  return enrollment;
}

/**
 * Record an additional payment on an existing enrollment (installment or
 * balance settlement). Accrues commission on the new amount and updates status.
 */
export async function recordPayment(
    enrollmentId: string | Types.ObjectId,
    amount: number,
    method?: PaymentMethod,
): Promise<IEnrollment> {
  if (amount <= 0) throw ApiError.badRequest('Payment amount must be positive');

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) throw ApiError.notFound('Enrollment not found');

  const remaining = enrollment.totalAmount - enrollment.amountPaid;
  if (remaining <= 0) throw ApiError.badRequest('Enrollment is already fully paid');
  if (amount > remaining) throw ApiError.badRequest(`Payment exceeds remaining balance (${remaining})`);

  const course = await Course.findById(enrollment.courseId);
  if (!course) throw ApiError.notFound('Course not found');

  enrollment.amountPaid += amount;
  if (method) enrollment.paymentMethod = method;
  enrollment.paymentStatus = derivePaymentStatus(enrollment.amountPaid, enrollment.totalAmount);

  await accrueCommission(enrollment, course, amount);
  await enrollment.save();

  const student = await User.findById(enrollment.studentId).select('phone name');
  if (student) {
    const left = enrollment.totalAmount - enrollment.amountPaid;
    await notifyStudent(student, {
      whatsapp:
          left > 0
              ? `💵 استلمنا دفعة ${amount} لدورة ${course.title.ar}. المتبقّي ${left}.`
              : `🎉 اكتمل دفع دورة ${course.title.ar}. شكراً لك!`,
    });
  }

  return enrollment;
}
