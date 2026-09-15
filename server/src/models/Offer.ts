import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import type { DiscountType, OfferType } from '../types/index.js';

export interface IOfferConditions {
  minEnrollments?: number;
  referralCount?: number;
  buyCourseId?: Types.ObjectId | null; // for bundle: buy A get B
  getCourseId?: Types.ObjectId | null;
}

export interface IOffer extends Document {
  _id: Types.ObjectId;
  type: OfferType;
  name: string;
  description?: string;
  code?: string | null; // coupon code
  discountType: DiscountType;
  discountValue: number; // percent (0-100) or fixed amount
  eligibleCourses: Types.ObjectId[]; // empty = all courses
  conditions: IOfferConditions;
  validFrom?: Date | null;
  validTo?: Date | null;
  usageLimit?: number | null; // null = unlimited
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    type: {
      type: String,
      enum: ['bundle', 'referral', 'group', 'coupon', 'earlybird', 'installment', 'loyalty_voucher'],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    code: { type: String, default: null, uppercase: true, trim: true, sparse: true, index: true },
    discountType: { type: String, enum: ['percent', 'fixed', 'free_course'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    eligibleCourses: { type: [Schema.Types.ObjectId], ref: 'Course', default: [] },
    conditions: {
      minEnrollments: { type: Number, default: 0 },
      referralCount: { type: Number, default: 0 },
      buyCourseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
      getCourseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
    },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

/** Whether the offer is usable right now (dates, active flag, usage cap). */
offerSchema.methods.isValidNow = function (this: IOffer): boolean {
  if (!this.isActive) return false;
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validTo && now > this.validTo) return false;
  if (this.usageLimit != null && this.usedCount >= this.usageLimit) return false;
  return true;
};

export const Offer = mongoose.models.Offer || model<IOffer>('Offer', offerSchema);
