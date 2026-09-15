import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import type { SessionStatus, SessionType } from '../types/index.js';

export interface ISession extends Document {
  _id: Types.ObjectId;
  studentId?: Types.ObjectId | null; // null = open available slot
  adminId?: Types.ObjectId | null;
  type: SessionType;
  scheduledAt: Date;
  duration: number; // minutes
  status: SessionStatus;
  isPaid: boolean;
  notes: {
    internal?: string;
    studentVisible?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: ['mentorship', 'followup', 'career'],
      default: 'mentorship',
    },
    scheduledAt: { type: Date, required: true, index: true },
    duration: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    isPaid: { type: Boolean, default: false },
    notes: {
      internal: { type: String, default: '' },
      studentVisible: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export const Session = mongoose.models.Session || model<ISession>('Session', sessionSchema);
