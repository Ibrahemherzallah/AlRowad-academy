import type { Request, Response } from 'express';
import type { FilterQuery } from 'mongoose';
import { ContactMessage, type IContactMessage } from '@/models';
import { sendEmail } from '@/services/notify.service';
import { env } from '@/config/env';
import { ApiError } from '@/utils/apiError';
import { catchAsync } from '@/utils/catchAsync';
import { ok } from '@/utils/apiResponse';
import type { CreateContactInput } from '@/validators/contact.validators';
import type { AuthedRequest } from '@/middleware/auth';

/** POST /api/contact — public contact form submission. */
export const submitContact = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body as CreateContactInput;

  const doc = await ContactMessage.create({ name, email, phone, subject, message });

  // Notify the academy inbox (best-effort; failure shouldn't block the user).
  void sendEmail(
    env.EMAIL_FROM,
    `📨 رسالة تواصل جديدة: ${subject || 'بدون موضوع'}`,
    `<h3>رسالة جديدة من نموذج التواصل</h3>
     <p><strong>الاسم:</strong> ${name}</p>
     <p><strong>البريد:</strong> ${email}</p>
     ${phone ? `<p><strong>الهاتف:</strong> ${phone}</p>` : ''}
     ${subject ? `<p><strong>الموضوع:</strong> ${subject}</p>` : ''}
     <p><strong>الرسالة:</strong></p>
     <p>${message.replace(/\n/g, '<br/>')}</p>`,
  );

  return ok(res, { id: doc._id, message: 'تم استلام رسالتك، سنعود إليك قريباً.' }, 201);
});

/* ---------------- Admin ---------------- */

/** GET /api/admin/contact — list messages with optional status filter. */
export const adminListContact = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query as unknown as {
    status?: string;
    page?: number;
    limit?: number;
  };

  const filter: FilterQuery<IContactMessage> = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ContactMessage.countDocuments(filter),
  ]);

  return ok(res, items, 200, { page: Number(page), limit: Number(limit), total });
});

/** PATCH /api/admin/contact/:id — update message status. */
export const adminUpdateContact = catchAsync(async (req: AuthedRequest, res: Response) => {
  const doc = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
  );
  if (!doc) throw ApiError.notFound('Message not found');
  return ok(res, doc);
});

/** GET /api/admin/contact/unread-count — badge counter for the admin nav. */
export const adminUnreadCount = catchAsync(async (_req: AuthedRequest, res: Response) => {
  const count = await ContactMessage.countDocuments({ status: 'new' });
  return ok(res, { count });
});
