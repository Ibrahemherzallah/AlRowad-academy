import { z } from 'zod';

const phoneRegex = /^\+?[0-9]{9,15}$/;
const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export const createTeacherSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  password: z.string().min(8).max(128),
  bio: z.string().max(500).optional(),
  specialty: z.string().max(120).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
});

export const updateTeacherSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  specialty: z.string().max(120).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
});

export const connectStudentSchema = z.object({
  studentId: objectId,
  courseId: objectId,
  amount: z.number().min(0), // admin can enter 0 or any amount
  paymentMethod: z.enum(['online', 'bank_transfer', 'cash']).optional(),
  scheduleId: objectId.optional(),
  inviteCode: z.string().max(56).optional(),
});

export const adminCreateInviteSchema = z.object({
  courseId: objectId,
});

export const addPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['online', 'bank_transfer', 'cash']).optional(),
});
