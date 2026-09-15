import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

export interface IVideoProgress extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  lessonId: Types.ObjectId;
  courseId: Types.ObjectId;
  watchedSeconds: number;
  totalSeconds: number;
  completed: boolean;
  lastWatchedAt: Date;
}

const videoProgressSchema = new Schema<IVideoProgress>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lessonId: { type: Schema.Types.ObjectId, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  watchedSeconds: { type: Number, default: 0 },
  totalSeconds: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  lastWatchedAt: { type: Date, default: Date.now },
});

/** One progress record per (student, lesson). */
videoProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

export const VideoProgress =
  mongoose.models.VideoProgress || model<IVideoProgress>('VideoProgress', videoProgressSchema);
