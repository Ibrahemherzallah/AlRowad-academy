import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { isProd } from '../config/env.js';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err && typeof err === 'object' && 'name' in err) {
    const e = err as { name: string; message?: string; code?: number; keyValue?: unknown };
    if (e.name === 'ValidationError') {
      statusCode = 400;
      message = e.message ?? 'Validation error';
    } else if (e.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid identifier';
    } else if (e.code === 11000) {
      statusCode = 409;
      message = 'Duplicate value';
      details = e.keyValue;
    } else if (e.message) {
      message = e.message;
    }
  }

  if (statusCode >= 500) logger.error(message, err);

  res.status(statusCode).json({
    success: false,
    error: { message, details, ...(isProd ? {} : { stack: (err as Error)?.stack }) },
  });
}
