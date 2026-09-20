import type { Response } from 'express';
import { uploadImageToBunny, createBunnyVideo, bunnyUploadTarget } from '../services/video.service.js';

/**
 * POST /api/upload/video-init
 * Creates a video entry in Bunny Stream and returns the videoId + direct
 * upload URL so the teacher's browser can PUT the file straight to Bunny.
 * Body: { title: string }
 */
export const initVideoUpload = catchAsync(async (req: AuthedRequest, res: Response) => {
  const { title } = req.body as { title?: string };
  if (!title) throw ApiError.badRequest('title is required');

  const videoId = await createBunnyVideo(title);
  const target = videoId ? bunnyUploadTarget(videoId) : null;

  return ok(res, { videoId, uploadTarget: target }, 201);
});
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ok } from '../utils/apiResponse.js';
import type { AuthedRequest } from '../middleware/auth.js';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/upload/image
 * Accepts a raw image body (Content-Type: image/*) and uploads it to
 * Bunny.net Storage. Returns { url } for use as course thumbnail.
 * Requires teacher or admin role (checked in the route).
 */
export const uploadImage = catchAsync(async (req: AuthedRequest, res: Response) => {
  const mime = req.headers['content-type'] ?? '';
  const ext = ALLOWED_TYPES[mime];
  if (!ext) throw ApiError.badRequest('Only JPEG, PNG, and WebP images are accepted');

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const buffer = Buffer.concat(chunks);

  if (buffer.length > MAX_SIZE) throw ApiError.badRequest('Image must be under 5 MB');
  if (buffer.length === 0) throw ApiError.badRequest('Empty file');

  const fileName = `cover.${ext}`;
  const url = await uploadImageToBunny(buffer, fileName, mime);

  return ok(res, { url }, 201);
});
