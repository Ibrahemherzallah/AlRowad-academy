import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import { customAlphabet } from 'nanoid';

const serial = customAlphabet('0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 12);

export interface ICertificate extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  serialNumber: string;
  issuedAt: Date;
  verifyUrl: string;
}

const certificateSchema = new Schema<ICertificate>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  serialNumber: { type: String, unique: true, index: true },
  issuedAt: { type: Date, default: Date.now },
  verifyUrl: { type: String, default: '' },
});

certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

certificateSchema.pre('validate', function (next) {
  if (!this.serialNumber) this.serialNumber = `RA-${serial()}`;
  next();
});

export const Certificate =
  mongoose.models.Certificate || model<ICertificate>('Certificate', certificateSchema);
