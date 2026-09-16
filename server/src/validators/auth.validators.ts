import { z } from 'zod';

const phoneRegex = /^\+?[0-9]{9,15}$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name too short').max(80),
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  city: z.string().max(80).optional(),
  referralCode: z.string().max(16).optional(),
});

export const loginSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  password: z.string().min(1, 'Password required'),
});

export const forgotPasswordSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid token'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
