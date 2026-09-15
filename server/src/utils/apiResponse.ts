import type { Response } from 'express';

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
}

/** Standard success envelope: { success, data, meta? }. */
export function ok<T>(res: Response, data: T, statusCode = 200, meta?: Meta): Response {
  return res.status(statusCode).json({ success: true, data, ...(meta ? { meta } : {}) });
}
