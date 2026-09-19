import type { Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import { Course, type ICourse } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { ClassSchedule } from '../models/ClassSchedule.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ok } from '../utils/apiResponse.js';
import type { ListCoursesQuery } from '../validators/course.validators.js';
import type { AuthedRequest } from '../middleware/auth.js';

/** Strip lesson videoUrls from a course before returning to the public. */
function publicCourse(course: ICourse) {
  const obj = course.toObject({ virtuals: true }) as Record<string, any>;
  obj.curriculum = (obj.curriculum ?? []).map((section: Record<string, any>) => ({
    ...section,
    lessons: (section.lessons ?? []).map((lesson: Record<string, any>) => ({
      ...lesson,
      // Only free-preview lessons expose their video source publicly.
      videoUrl: lesson.isFreePreview ? lesson.videoUrl : '',
    })),
  }));
  return obj;
}

/**
 * GET /api/courses
 * Public listing. Only published + coming_soon are visible; supports
 * category/price/status filters, keyword search, sorting and pagination.
 */
export const listCourses = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListCoursesQuery;

  const filter: FilterQuery<ICourse> = {
    status: q.status ?? { $in: ['published', 'coming_soon'] },
  };

  if (q.category) filter.category = q.category;

  if (q.minPrice != null || q.maxPrice != null) {
    filter.price = {};
    if (q.minPrice != null) filter.price.$gte = q.minPrice;
    if (q.maxPrice != null) filter.price.$lte = q.maxPrice;
  }

  if (q.search) {
    const rx = new RegExp(q.search.trim(), 'i');
    filter.$or = [
      { 'title.ar': rx },
      { 'title.en': rx },
      { 'description.ar': rx },
      { 'description.en': rx },
      { category: rx },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 as const },
    price_asc: { price: 1 as const },
    price_desc: { price: -1 as const },
  };

  const skip = (q.page - 1) * q.limit;
  const [courses, total] = await Promise.all([
    Course.find(filter).sort(sortMap[q.sort]).skip(skip).limit(q.limit),
    Course.countDocuments(filter),
  ]);

  return ok(
    res,
    courses.map(publicCourse),
    200,
    { page: q.page, limit: q.limit, total },
  );
});

/** GET /api/courses/categories — distinct categories among visible courses. */
export const listCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await Course.distinct('category', {
    status: { $in: ['published', 'coming_soon'] },
  });
  return ok(res, categories);
});

/** GET /api/courses/:slug — public single course landing data. */
export const getCourseBySlug = catchAsync(async (req: Request, res: Response) => {
  const course = await Course.findOne({ slug: req.params.slug });
  if (!course || course.status === 'draft' || course.status === 'archived') {
    throw ApiError.notFound('Course not found');
  }

  const [enrolledCount, schedules, teacher] = await Promise.all([
    Enrollment.countDocuments({ courseId: course._id, status: { $in: ['active', 'pending'] } }),
    ClassSchedule.find({ courseId: course._id }).select('label days startTime endTime room capacity'),
    course.teacherId ? User.findById(course.teacherId).select('name bio specialty') : null,
  ]);

  const data = publicCourse(course);
  const isFull = course.maxStudents != null && enrolledCount >= course.maxStudents;

  return ok(res, { ...data, enrolledCount, isFull, schedules, teacher });
});

/* ---------------- Admin ---------------- */

/** GET /api/admin/courses — all courses regardless of status. */
export const adminListCourses = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  return ok(res, courses);
});

/** GET /api/admin/courses/:id — full course incl. private video URLs. */
export const adminGetCourse = catchAsync(async (req: AuthedRequest, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  return ok(res, course);
});

/** POST /api/admin/courses */
export const createCourse = catchAsync(async (req: AuthedRequest, res: Response) => {
  const exists = await Course.findOne({ slug: req.body.slug });
  if (exists) throw ApiError.conflict('A course with this slug already exists');
  const course = await Course.create(req.body);
  return ok(res, course, 201);
});

/** PATCH /api/admin/courses/:id */
export const updateCourse = catchAsync(async (req: AuthedRequest, res: Response) => {
  if (req.body.slug) {
    const clash = await Course.findOne({ slug: req.body.slug, _id: { $ne: req.params.id } });
    if (clash) throw ApiError.conflict('A course with this slug already exists');
  }
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!course) throw ApiError.notFound('Course not found');
  return ok(res, course);
});

/** DELETE /api/admin/courses/:id — soft archive by default. */
export const deleteCourse = catchAsync(async (req: AuthedRequest, res: Response) => {
  const hard = req.query.hard === 'true';
  if (hard) {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) throw ApiError.notFound('Course not found');
    return ok(res, { message: 'Course permanently deleted' });
  }
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { status: 'archived' },
    { new: true },
  );
  if (!course) throw ApiError.notFound('Course not found');
  return ok(res, course);
});
