import { z } from 'zod';

const localized = z.object({
  ar: z.string().min(1, 'Arabic value required'),
  en: z.string().min(1, 'English value required'),
});

const lessonSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1),
  videoUrl: z.string().default(''),
  bunnyVideoId: z.string().optional(),
  duration: z.number().min(0).default(0),
  isFreePreview: z.boolean().default(false),
  order: z.number().default(0),
});

const sectionSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1),
  order: z.number().default(0),
  lessons: z.array(lessonSchema).default([]),
});

export const createCourseSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  title: localized,
  description: localized,
  category: z.string().min(1),
  thumbnail: z.string().optional(),
  instructorName: z.string().optional(),
  instructorBio: z.string().optional(),
  price: z.number().min(0),
  discountedPrice: z.number().min(0).nullable().optional(),
  installmentOptions: z
    .array(z.object({ parts: z.number().int().min(2), amount: z.number().min(0) }))
    .optional(),
  status: z.enum(['draft', 'published', 'coming_soon', 'archived']).default('draft'),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  enrollmentDeadline: z.coerce.date().nullable().optional(),
  accessBufferWeeks: z.number().min(0).default(2),
  maxStudents: z.number().int().min(1).nullable().optional(),
  waitlistEnabled: z.boolean().optional(),
  loyaltyPointsOverride: z.number().int().min(0).nullable().optional(),
  curriculum: z.array(sectionSchema).optional(),
  attachments: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const listCoursesQuerySchema = z.object({
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'coming_soon', 'archived']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

export const slugParamSchema = z.object({ slug: z.string().min(1) });
export const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });

export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
