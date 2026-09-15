import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import type { CourseStatus, LocalizedString } from '../types/index.js';

export interface ILesson {
  _id: Types.ObjectId;
  title: string;
  videoUrl: string;
  duration: number; // seconds
  isFreePreview: boolean;
  order: number;
}

export interface ISection {
  _id: Types.ObjectId;
  title: string;
  order: number;
  lessons: ILesson[];
}

export interface IInstallmentOption {
  parts: number;
  amount: number;
}

export interface IFaq {
  question: string;
  answer: string;
}

export interface IAttachment {
  label: string;
  url: string;
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  category: string;
  thumbnail?: string;
  instructorName?: string;
  instructorBio?: string;
  price: number;
  discountedPrice?: number | null;
  installmentOptions: IInstallmentOption[];
  status: CourseStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  enrollmentDeadline?: Date | null;
  accessBufferWeeks: number;
  maxStudents?: number | null;
  waitlistEnabled: boolean;
  loyaltyPointsOverride?: number | null; // null = use global default
  curriculum: ISection[];
  attachments: IAttachment[];
  faqs: IFaq[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  videoUrl: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  isFreePreview: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const sectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  lessons: { type: [lessonSchema], default: [] },
});

const localized = { ar: { type: String, default: '' }, en: { type: String, default: '' } };

const courseSchema = new Schema<ICourse>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: localized, required: true },
    description: { type: localized, required: true },
    category: { type: String, required: true, index: true },
    thumbnail: { type: String, default: '' },
    instructorName: { type: String, default: '' },
    instructorBio: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, default: null, min: 0 },
    installmentOptions: {
      type: [{ parts: Number, amount: Number }],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'coming_soon', 'archived'],
      default: 'draft',
      index: true,
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    enrollmentDeadline: { type: Date, default: null },
    accessBufferWeeks: { type: Number, default: 2 },
    maxStudents: { type: Number, default: null },
    waitlistEnabled: { type: Boolean, default: false },
    loyaltyPointsOverride: { type: Number, default: null },
    curriculum: { type: [sectionSchema], default: [] },
    attachments: { type: [{ label: String, url: String }], default: [] },
    faqs: { type: [{ question: String, answer: String }], default: [] },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
  },
  { timestamps: true },
);

courseSchema.virtual('effectivePrice').get(function (this: ICourse) {
  return this.discountedPrice != null && this.discountedPrice < this.price
    ? this.discountedPrice
    : this.price;
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

export const Course = mongoose.models.Course || model<ICourse>('Course', courseSchema);
