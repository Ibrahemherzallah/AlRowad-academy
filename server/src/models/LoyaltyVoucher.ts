import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import { customAlphabet } from 'nanoid';
import type { VoucherStatus } from '../types/index.js';

const voucherCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 10);

export interface ILoyaltyVoucher extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  code: string;
  discountPercent: number;
  status: VoucherStatus;
  issuedAt: Date;
  usedAt?: Date | null;
  usedOnCourseId?: Types.ObjectId | null;
  expiresAt?: Date | null; // null = no expiry
}

const loyaltyVoucherSchema = new Schema<ILoyaltyVoucher>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  code: { type: String, unique: true, index: true },
  discountPercent: { type: Number, default: 20, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active',
    index: true,
  },
  issuedAt: { type: Date, default: Date.now },
  usedAt: { type: Date, default: null },
  usedOnCourseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
  expiresAt: { type: Date, default: null },
});

loyaltyVoucherSchema.pre('validate', function (next) {
  if (!this.code) this.code = `LOYAL-${voucherCode()}`;
  next();
});

loyaltyVoucherSchema.methods.isRedeemable = function (this: ILoyaltyVoucher): boolean {
  if (this.status !== 'active') return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

export const LoyaltyVoucher =
  mongoose.models.LoyaltyVoucher ||
  model<ILoyaltyVoucher>('LoyaltyVoucher', loyaltyVoucherSchema);
