import { z } from 'zod';

const phoneRegex = /^\+?[0-9]{9,15}$/;

export const createContactSchema = z.object({
  name: z.string().min(2, 'Name too short').max(80),
  email: z.string().email('Invalid email'),
  phone: z
    .string()
    .regex(phoneRegex, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  subject: z.string().max(150).optional(),
  message: z.string().min(5, 'Message too short').max(3000),
});

export const listContactQuerySchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const updateContactSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'archived']),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
