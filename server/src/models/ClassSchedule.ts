import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

/** 0 = Sunday … 6 = Saturday (matches JS Date.getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface IClassSchedule extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  teacherId: Types.ObjectId;
  /** Human label for this group/section, e.g. "المجموعة الصباحية". */
  label: string;
  /** Recurring weekdays this class meets. */
  days: Weekday[];
  /** Local clock times, "HH:mm" 24h, e.g. "09:00". */
  startTime: string;
  endTime: string;
  /** Optional term window. */
  startDate?: Date | null;
  endDate?: Date | null;
  room?: string;
  capacity?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const classScheduleSchema = new Schema<IClassSchedule>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, default: '', trim: true },
    days: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr: number[]) => arr.every((d) => d >= 0 && d <= 6),
        message: 'days must be 0–6 (Sun–Sat)',
      },
    },
    startTime: {
      type: String,
      required: true,
      validate: { validator: (v: string) => timeRegex.test(v), message: 'startTime must be HH:mm' },
    },
    endTime: {
      type: String,
      required: true,
      validate: { validator: (v: string) => timeRegex.test(v), message: 'endTime must be HH:mm' },
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    room: { type: String, default: '' },
    capacity: { type: Number, default: null },
  },
  { timestamps: true },
);

export const ClassSchedule =
  mongoose.models.ClassSchedule ||
  model<IClassSchedule>('ClassSchedule', classScheduleSchema);
