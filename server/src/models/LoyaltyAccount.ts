import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import type { LoyaltyAction } from '../types/index.js';

export interface ILoyaltyHistoryEntry {
  action: LoyaltyAction;
  points: number; // positive or negative
  reason: string;
  courseId?: Types.ObjectId | null;
  createdAt: Date;
}

export interface ILoyaltyAccount extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  pointsBalance: number; // resets to 0 after voucher redemption
  lifetimePointsEarned: number; // never resets
  history: ILoyaltyHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyAccountSchema = new Schema<ILoyaltyAccount>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    pointsBalance: { type: Number, default: 0, min: 0 },
    lifetimePointsEarned: { type: Number, default: 0, min: 0 },
    history: {
      type: [
        {
          action: {
            type: String,
            enum: ['earned', 'deducted', 'redeemed', 'manual_adjustment'],
            required: true,
          },
          points: { type: Number, required: true },
          reason: { type: String, required: true },
          courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const LoyaltyAccount =
  mongoose.models.LoyaltyAccount ||
  model<ILoyaltyAccount>('LoyaltyAccount', loyaltyAccountSchema);
