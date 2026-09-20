import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';
export type Role = 'student' | 'teacher' | 'admin' | 'superadmin';

const refCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  passwordHash: string;
  city?: string;
  role: Role;
  referralCode: string;
  referredBy?: Types.ObjectId | null;
  loyaltyAccountId?: Types.ObjectId | null;
  // Teacher-only fields (null/0 for students & admins)
  bio?: string;
  specialty?: string;
  commissionRate?: number; // default 0.10 (10%); admin-adjustable per teacher
  tokenVersion: number;
  isVerified: boolean;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    city: { type: String, trim: true },
    role: { type: String, enum: ['student', 'teacher', 'admin', 'superadmin'], default: 'student', index: true },
    referralCode: { type: String, unique: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    loyaltyAccountId: { type: Schema.Types.ObjectId, ref: 'LoyaltyAccount', default: null },
    bio: { type: String, default: '' },
    specialty: { type: String, default: '' },
    commissionRate: { type: Number, default: 0.1, min: 0, max: 1 },
    tokenVersion: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.pre('validate', function (next) {
  if (!this.referralCode) this.referralCode = refCode();
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

/** Never leak sensitive fields in JSON. */
userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    const r = ret as unknown as Record<string, unknown>;
    delete r.passwordHash;
    delete r.passwordResetToken;
    delete r.passwordResetExpires;
    delete r.tokenVersion;
    delete r.__v;
    return r;
  },
});

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export const User = mongoose.models.User || model<IUser>('User', userSchema);
