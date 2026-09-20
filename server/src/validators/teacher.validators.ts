import { z } from 'zod';

const localized = z.object({
  ar: z.string().min(1),
  en: z.string().min(1),
});

/** Teacher-facing course create — simpler than admin (hours + basics). */
export const teacherCreateCourseSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  title: localized,
  description: localized,
  category: z.string().min(1),
  thumbnail: z.string().optional(),
  totalHours: z.number().min(0),
  price: z.number().min(0),
  discountedPrice: z.number().min(0).nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  properties: z.array(z.string().min(1).max(200)).optional(),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).optional(),
});

export const teacherUpdateCourseSchema = teacherCreateCourseSchema.partial();

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleSchema = z.object({
  courseId: z.string().regex(/^[a-f\d]{24}$/i),
  label: z.string().max(80).optional(),
  days: z.array(z.number().int().min(0).max(6)).min(1, 'Pick at least one day'),
  startTime: z.string().regex(timeRegex, 'startTime must be HH:mm'),
  endTime: z.string().regex(timeRegex, 'endTime must be HH:mm'),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  room: z.string().max(60).optional(),
  capacity: z.number().int().min(1).nullable().optional(),
});

export const updateScheduleSchema = scheduleSchema.partial().omit({ courseId: true });

export const createInviteSchema = z.object({
  courseId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const updateTeacherProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  specialty: z.string().max(120).optional(),
});
