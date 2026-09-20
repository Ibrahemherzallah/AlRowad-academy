import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

export type DiscountScope = 'all' | 'category' | 'courses';
export type DiscountType = 'percent' | 'fixed';

export interface IDiscount extends Document {
  _id: Types.ObjectId;
  label: string;               // Display name, e.g. "عرض رمضان"
  type: DiscountType;
  value: number;               // percent 0-100 or fixed amount
  scope: DiscountScope;
  category?: string;           // if scope = category
  courseIds?: Types.ObjectId[];// if scope = courses
  isActive: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<IDiscount>(
  {
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true, min: 0 },
    scope: { type: String, enum: ['all', 'category', 'courses'], required: true },
    category: { type: String, default: null },
    courseIds: { type: [Schema.Types.ObjectId], ref: 'Course', default: [] },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Discount =
  mongoose.models.Discount || model<IDiscount>('Discount', discountSchema);
