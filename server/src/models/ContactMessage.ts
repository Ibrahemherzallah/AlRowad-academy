import mongoose, { Schema, model, type Document, type Types } from 'mongoose';

export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

export interface IContactMessage extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true },
);

export const ContactMessage =
  mongoose.models.ContactMessage ||
  model<IContactMessage>('ContactMessage', contactSchema);
