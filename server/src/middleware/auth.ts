import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/apiError.js';
import type { Role } from '../types/index.js';

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
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
    next();
  };
}
