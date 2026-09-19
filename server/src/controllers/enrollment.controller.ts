import type { Request, Response } from 'express';
import { InviteLink } from '../models/InviteLink.js';
import { Course } from '../models/Course.js';
import { ClassSchedule } from '../models/ClassSchedule.js';
import { createReservation } from '../services/enrollment.service';
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ok } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import type { AuthedRequest } from '../middleware/auth.js';

/**
 * GET /api/invites/:code (public)
 * Resolve an invite link to its course so the join page can render before
 * the visitor logs in.
 */
export const resolveInvite = catchAsync(async (req: Request, res: Response) => {
  const invite = await InviteLink.findOne({ code: req.params.code.toUpperCase(), isActive: true });
  if (!invite) throw ApiError.notFound('Invite link is invalid or expired');

  const course = await Course.findById(invite.courseId).select(
    'title description slug thumbnail category price discountedPrice totalHours status',
  );
  if (!course || course.status !== 'published') throw ApiError.notFound('Course unavailable');

  const schedules = await ClassSchedule.find({ courseId: course._id }).select(
    'label days startTime endTime room',
  );

  return ok(res, { code: invite.code, course, schedules });
});

/**
 * POST /api/enrollments/reserve
 * Student reserves a seat by paying >= the minimum percentage. Optional
 * inviteCode (teacher commission / referral points) and scheduleId.
 */
export const reserveSeat = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { courseId, amount, inviteCode, scheduleId, paymentMethod } = req.body as {
    courseId: string;
    amount: number;
    inviteCode?: string;
    scheduleId?: string;
    paymentMethod?: 'online' | 'bank_transfer' | 'cash';
  };

  const enrollment = await createReservation({
    studentId: req.user!.id,
    courseId,
    amount,
    inviteCode: inviteCode ?? null,
    scheduleId: scheduleId ?? null,
    paymentMethod,
  });

  return ok(res, enrollment, 201);
});

/* ---- Student invite links (referral, earns points) ---- */

/** GET /api/enrollments/my-invites — student's referral links. */
export const myInvites = catchAsync(async (req: AuthedRequest, res: Response) => {
  const invites = await InviteLink.find({ inviterId: req.user!.id, inviterRole: 'student' })
    .populate('courseId', 'title slug')
    .sort({ createdAt: -1 });
  return ok(
    res,
    invites.map((i) => ({ ...i.toObject(), url: `${env.CLIENT_URL}/join/${i.code}` })),
  );
});

/** POST /api/enrollments/my-invites — create/reuse a referral link for a course. */
export const createMyInvite = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { courseId } = req.body as { courseId: string };
  const course = await Course.findById(courseId).select('_id status');
  if (!course || course.status !== 'published') throw ApiError.notFound('Course not found');

  let invite = await InviteLink.findOne({
    inviterId: req.user!.id,
    courseId,
    inviterRole: 'student',
    isActive: true,
  });
  if (!invite) {
    invite = await InviteLink.create({
      inviterId: req.user!.id,
      inviterRole: 'student',
      courseId,
    });
  }
  return ok(res, { ...invite.toObject(), url: `${env.CLIENT_URL}/join/${invite.code}` }, 201);
});
