import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/apiError.js';
export type Role = 'student' | 'teacher' | 'admin' | 'superadmin';

export interface AuthedRequest extends Request {
  user?: { id: string; role: Role };
}

/** Requires a valid access token in the Authorization: Bearer header. */
export function authenticate(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing access token'));
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired access token'));
  }
}

/** Restricts a route to one or more roles. Use after `authenticate`. */
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    // superadmin always passes every role check
    if (req.user.role !== 'superadmin' && !roles.includes(req.user.role))
      return next(ApiError.forbidden('Insufficient permissions'));
    next();
  };
}

/**
 * Populates req.user when a valid access token is present, but does NOT reject
 * when it's missing/invalid. Used for endpoints that behave differently for
 * logged-in vs anonymous users (e.g. free-preview videos).
 */
export function optionalAuthenticate(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      /* ignore — treat as anonymous */
    }
  }
  next();
}
