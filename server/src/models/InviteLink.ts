import mongoose, { Schema, model, type Document, type Types } from 'mongoose';
import { customAlphabet } from 'nanoid';

const inviteCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

/**
 * Invite link, created by a teacher or a student for a specific course.
 * - teacher link → teacher earns commission on the joiner's payments
 * - student link → inviter earns loyalty points when the friend joins
 */
export interface IInviteLink extends Document {
  _id: Types.ObjectId;
  code: string;
  inviterId: Types.ObjectId;
  inviterRole: 'teacher' | 'student' | 'admin';
  courseId: Types.ObjectId;
  uses: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inviteLinkSchema = new Schema<IInviteLink>(
  {
    code: { type: String, unique: true, index: true },
    inviterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inviterRole: { type: String, enum: ['teacher', 'student', 'admin'], required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    uses: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

inviteLinkSchema.pre('validate', function (next) {
  if (!this.code) this.code = inviteCode();
  next();
});

export const InviteLink =
  mongoose.models.InviteLink || model<IInviteLink>('InviteLink', inviteLinkSchema);
