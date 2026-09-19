import type { Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '@/models';
import { Enrollment } from '@/models';
import { signPlayback } from '@/services/video.service';
import { ApiError } from '@/utils/apiError';
import { catchAsync } from '@/utils/catchAsync';
import { ok } from '@/utils/apiResponse';
import type { AuthedRequest } from '@/middleware/auth';

/** Locate a lesson (and its course) by lessonId across curriculum. */
async function findLesson(lessonId: string) {
  const course = await Course.findOne({ 'curriculum.lessons._id': lessonId });
  if (!course) return null;
  for (const section of course.curriculum) {
    const lesson = section.lessons.find((l: { _id: unknown }) => String(l._id) === String(lessonId));
    if (lesson) return { course, lesson };
  }
  return null;
}

/**
 * GET /api/videos/:lessonId/play
 * Returns a short-lived signed playback URL — but only if the requester is
 * allowed to watch this lesson:
 *   - free-preview lessons: anyone (even logged-out) may watch
 *   - otherwise: the student must have an ACTIVE enrollment in the course,
 *     within the access window (reservation ≥30% already unlocked access)
 */
export const getPlayback = catchAsync(async (req: AuthedRequest, res: Response) => {
  const found = await findLesson(req.params.lessonId);
  if (!found) throw ApiError.notFound('Lesson not found');
  const { course, lesson } = found;

  // Free preview — no gating.
  if (lesson.isFreePreview) {
    const signed = signPlayback(lesson.bunnyVideoId ?? '', lesson.videoUrl);
    return ok(res, { ...signed, lessonId: lesson._id, title: lesson.title, free: true });
  }

  // Paid lesson — require an authenticated student with valid access.
  if (!req.user) throw ApiError.unauthorized('Login required to watch this lesson');

  // Admins and the owning teacher can always watch.
  const privileged =
    req.user.role === 'admin' ||
    (req.user.role === 'teacher' && String(course.teacherId) === req.user.id);

  if (!privileged) {
    const enrollment = await Enrollment.findOne({
      studentId: new Types.ObjectId(req.user.id),
      courseId: course._id,
      status: 'active',
    });
    if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course');

    // Enforce the access window (reservation active + not expired).
    const now = new Date();
    if (enrollment.accessStartDate && now < enrollment.accessStartDate) {
      throw ApiError.forbidden('Your access has not started yet');
    }
    if (enrollment.accessEndDate && now > enrollment.accessEndDate) {
      throw ApiError.forbidden('Your access period for this course has ended');
    }
  }

  const signed = signPlayback(lesson.bunnyVideoId ?? '', lesson.videoUrl);
  return ok(res, { ...signed, lessonId: lesson._id, title: lesson.title, free: false });
});
