import { z } from 'zod';

export const reserveSchema = z.object({
  courseId: z.string().regex(/^[a-f\d]{24}$/i),
  amount: z.number().positive('Amount must be positive'),
  inviteCode: z.string().max(16).optional(),
  scheduleId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  paymentMethod: z.enum(['online', 'bank_transfer', 'cash']).optional(),
});

export const createInviteSchema = z.object({
  courseId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const codeParamSchema = z.object({ code: z.string().min(4).max(16) });
