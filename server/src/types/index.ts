export type Role = 'student' | 'teacher' | 'admin' | 'superadmin';

export type CourseStatus = 'draft' | 'published' | 'coming_soon' | 'archived';

export type EnrollmentStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'online' | 'bank_transfer' | 'cash';

export type OfferType =
  | 'bundle'
  | 'referral'
  | 'group'
  | 'coupon'
  | 'earlybird'
  | 'installment'
  | 'loyalty_voucher';

export type DiscountType = 'percent' | 'fixed' | 'free_course';

export type SessionType = 'mentorship' | 'followup' | 'career';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export type LoyaltyAction = 'earned' | 'deducted' | 'redeemed' | 'manual_adjustment';
export type VoucherStatus = 'active' | 'used' | 'expired';

/** Localised string: Arabic + English. */
export interface LocalizedString {
  ar: string;
  en: string;
}
