import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import type { EnrollmentStatus, PaymentMethod, PaymentStatus } from '@/types';

export interface IInstallment {
  dueDate: Date;
  amount: number;
  paidAt?: Date | null;
}

export interface IAppliedOffer {
  offerId?: Types.ObjectId | null;
  loyaltyVoucherId?: Types.ObjectId | null;
  type: string;
  label: string;
  discountAmount: number;
}

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  totalAmount: number;
  accessStartDate?: Date | null;
  accessEndDate?: Date | null;
  installments: IInstallment[];
  offersApplied: IAppliedOffer[];
  loyaltyAwarded: boolean; // guard so enrolment points are granted once
  // Reservation & attribution
  invitedVia?: Types.ObjectId | null; // InviteLink used to join
  scheduleId?: Types.ObjectId | null; // which class/section the student picked
  commissionedAmount: number; // sum of student payments already commissioned
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['online', 'bank_transfer', 'cash'],
      default: 'online',
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    accessStartDate: { type: Date, default: null },
    accessEndDate: { type: Date, default: null },
    installments: {
      type: [{ dueDate: Date, amount: Number, paidAt: { type: Date, default: null } }],
      default: [],
    },
    offersApplied: {
      type: [
        {
          offerId: { type: Schema.Types.ObjectId, ref: 'Offer', default: null },
          loyaltyVoucherId: { type: Schema.Types.ObjectId, ref: 'LoyaltyVoucher', default: null },
          type: String,
          label: String,
          discountAmount: Number,
        },
      ],
      default: [],
    },
    loyaltyAwarded: { type: Boolean, default: false },
    invitedVia: { type: Schema.Types.ObjectId, ref: 'InviteLink', default: null },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'ClassSchedule', default: null },
    commissionedAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

/** A student may not have two active enrollments in the same course. */
enrollmentSchema.index({ studentId: 1, courseId: 1, status: 1 });

/** True when access window currently permits video viewing. */
enrollmentSchema.methods.hasAccess = function (this: IEnrollment): boolean {
  if (this.status !== 'active') return false;
  const now = new Date();
  if (this.accessStartDate && now < this.accessStartDate) return false;
  if (this.accessEndDate && now > this.accessEndDate) return false;
  return true;
};

export const Enrollment =
  mongoose.models.Enrollment || model<IEnrollment>('Enrollment', enrollmentSchema);
