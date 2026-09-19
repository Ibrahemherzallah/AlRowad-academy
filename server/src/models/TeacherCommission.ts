import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

export type CommissionStatus = 'accrued' | 'paid';

/**
 * One commission record per payment event. The teacher earns their rate
 * (default 10%) of the amount a student actually paid. Records accrue as
 * payments arrive (reservation, then installments) and are marked `paid`
 * when the admin settles the teacher's payout.
 */
export interface ITeacherCommission extends Document {
  _id: Types.ObjectId;
  teacherId: Types.ObjectId;
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  inviteLinkId?: Types.ObjectId | null;
  basisAmount: number; // the student payment this commission is computed from
  rate: number; // e.g. 0.10
  amount: number; // basisAmount * rate
  status: CommissionStatus;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const teacherCommissionSchema = new Schema<ITeacherCommission>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    inviteLinkId: { type: Schema.Types.ObjectId, ref: 'InviteLink', default: null },
    basisAmount: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0, max: 1 },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['accrued', 'paid'], default: 'accrued', index: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const TeacherCommission =
  mongoose.models.TeacherCommission ||
  model<ITeacherCommission>('TeacherCommission', teacherCommissionSchema);
