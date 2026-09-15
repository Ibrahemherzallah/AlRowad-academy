import { Types } from 'mongoose';
import { LoyaltyAccount, type ILoyaltyAccount } from '../models/LoyaltyAccount.js';
import { LoyaltyVoucher, type ILoyaltyVoucher } from '../models/LoyaltyVoucher.js';
import { User } from '../models/User.js';
import { getSettings } from '../models/Settings.js';
import { notifyStudent } from './notify.service.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

/** Ensure a student has a loyalty account; create + link if missing. */
export async function ensureLoyaltyAccount(studentId: string | Types.ObjectId): Promise<ILoyaltyAccount> {
  const id = new Types.ObjectId(studentId);
  let account = await LoyaltyAccount.findOne({ studentId: id });
  if (!account) {
    account = await LoyaltyAccount.create({ studentId: id });
    await User.findByIdAndUpdate(id, { loyaltyAccountId: account._id });
  }
  return account;
}

interface AwardResult {
  account: ILoyaltyAccount;
  voucher?: ILoyaltyVoucher;
  thresholdReached: boolean;
}

/**
 * Award enrollment points and, if the threshold is crossed, auto-issue a
 * voucher and reset the balance. Idempotency is the caller's responsibility
 * (guard via Enrollment.loyaltyAwarded).
 */
export async function awardEnrollmentPoints(
  studentId: string | Types.ObjectId,
  courseId: string | Types.ObjectId,
  courseTitle: string,
  pointsOverride?: number | null,
): Promise<AwardResult> {
  const settings = await getSettings();
  if (!settings.loyalty.enabled) {
    const account = await ensureLoyaltyAccount(studentId);
    return { account, thresholdReached: false };
  }

  const points = pointsOverride ?? settings.loyalty.pointsPerEnrollment;
  const account = await ensureLoyaltyAccount(studentId);

  account.pointsBalance += points;
  account.lifetimePointsEarned += points;
  account.history.push({
    action: 'earned',
    points,
    reason: `Enrolled in ${courseTitle}`,
    courseId: new Types.ObjectId(courseId),
    createdAt: new Date(),
  });

  let voucher: ILoyaltyVoucher | undefined;
  let thresholdReached = false;

  if (account.pointsBalance >= settings.loyalty.threshold) {
    thresholdReached = true;
    const expiresAt = settings.loyalty.voucherExpiryDays
      ? new Date(Date.now() + settings.loyalty.voucherExpiryDays * 86_400_000)
      : null;

    const issued = (await LoyaltyVoucher.create({
      studentId: account.studentId,
      discountPercent: settings.loyalty.voucherDiscountPercent,
      expiresAt,
    })) as ILoyaltyVoucher;
    voucher = issued;

    const redeemed = account.pointsBalance;
    account.pointsBalance = 0;
    account.history.push({
      action: 'redeemed',
      points: -redeemed,
      reason: `Threshold reached — issued ${issued.discountPercent}% voucher`,
      createdAt: new Date(),
    });
  }

  await account.save();

  // Fire-and-forget notifications
  const student = await User.findById(studentId).select('phone email name');
  if (student) {
    await notifyStudent(student, {
      whatsapp: `🎓 كسبت ${points} نقاط من التسجيل في ${courseTitle}!`,
    });
    if (voucher) {
      await notifyStudent(student, {
        whatsapp: `🎉 مبروك! وصلت للحد المطلوب وكسبت قسيمة خصم ${voucher.discountPercent}%. الكود: ${voucher.code}`,
      });
    }
  }

  logger.info(`Loyalty: +${points} to ${studentId} (balance ${account.pointsBalance})`);
  return { account, voucher, thresholdReached };
}

/** Reverse points on refund (e.g. cancelled enrollment). Balance floors at 0. */
export async function reversePoints(
  studentId: string | Types.ObjectId,
  courseId: string | Types.ObjectId,
  courseTitle: string,
  pointsOverride?: number | null,
): Promise<ILoyaltyAccount> {
  const settings = await getSettings();
  const points = pointsOverride ?? settings.loyalty.pointsPerEnrollment;
  const account = await ensureLoyaltyAccount(studentId);

  const deduct = Math.min(points, account.pointsBalance);
  account.pointsBalance -= deduct;
  account.history.push({
    action: 'deducted',
    points: -deduct,
    reason: `Refund reversal — ${courseTitle}`,
    courseId: new Types.ObjectId(courseId),
    createdAt: new Date(),
  });
  await account.save();
  return account;
}

/** Admin: add or remove points manually with an audit reason. */
export async function manualAdjust(
  studentId: string | Types.ObjectId,
  delta: number,
  reason: string,
): Promise<ILoyaltyAccount> {
  if (!reason?.trim()) throw ApiError.badRequest('A reason is required for manual adjustments');
  const account = await ensureLoyaltyAccount(studentId);

  const applied = delta < 0 ? Math.max(delta, -account.pointsBalance) : delta;
  account.pointsBalance += applied;
  if (applied > 0) account.lifetimePointsEarned += applied;
  account.history.push({
    action: 'manual_adjustment',
    points: applied,
    reason: reason.trim(),
    createdAt: new Date(),
  });
  await account.save();
  return account;
}

/** Mark a voucher used on a given course (called during enrollment). */
export async function redeemVoucher(
  voucherId: string | Types.ObjectId,
  courseId: string | Types.ObjectId,
): Promise<ILoyaltyVoucher> {
  const voucher = await LoyaltyVoucher.findById(voucherId);
  if (!voucher) throw ApiError.notFound('Voucher not found');
  if (!voucher.isRedeemable()) throw ApiError.badRequest('Voucher is not redeemable');

  voucher.status = 'used';
  voucher.usedAt = new Date();
  voucher.usedOnCourseId = new Types.ObjectId(courseId);
  await voucher.save();
  return voucher;
}
