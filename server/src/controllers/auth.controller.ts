import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { User, hashPassword } from '@/models';
import { ensureLoyaltyAccount } from '@/services/loyalty.service';
import { notifyStudent } from '@/services/notify.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/tokens';
import { ApiError } from '@/utils/apiError';
import { catchAsync } from '@/utils/catchAsync';
import { ok } from '@/utils/apiResponse';
import { env } from '@/config/env';
import type { AuthedRequest } from '@/middleware/auth';
import type { RegisterInput, LoginInput } from '@/validators/auth.validators';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30d
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

async function issueTokens(res: Response, user: { id: string; role: 'student' | 'admin'; tokenVersion: number }) {
  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, user.tokenVersion);
  setRefreshCookie(res, refreshToken);
  return accessToken;
}

/** POST /api/auth/register */
export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, phone, password, city, referralCode } = req.body as RegisterInput;

  const existing = await User.findOne({ phone });
  if (existing) throw ApiError.conflict('Phone already registered');

  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (referrer) referredBy = referrer._id;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, phone, passwordHash, city, referredBy });

  await ensureLoyaltyAccount(user._id.toString());

  await notifyStudent(user, {
    whatsapp: `أهلاً ${name} 👋 تم إنشاء حسابك في اكاديمية الرواد بنجاح!`,
  });

  const accessToken = await issueTokens(res, {
    id: user._id.toString(),
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  return ok(res, { user, accessToken }, 201);
});

/** POST /api/auth/login — sign in with phone + password. */
export const login = catchAsync(async (req: Request, res: Response) => {
  const { phone, password } = req.body as LoginInput;

  const user = await User.findOne({ phone }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid credentials');

  const accessToken = await issueTokens(res, {
    id: user._id.toString(),
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  user.passwordHash = undefined as unknown as string;
  return ok(res, { user, accessToken });
});

/** POST /api/auth/refresh — rotates access token from the refresh cookie. */
export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Refresh token revoked');
  }

  const accessToken = await issueTokens(res, {
    id: user._id.toString(),
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  return ok(res, { user, accessToken });
});

/** POST /api/auth/logout — invalidates the refresh cookie. */
export const logout = catchAsync(async (_req: Request, res: Response) => {
  clearRefreshCookie(res);
  return ok(res, { message: 'Logged out' });
});

/** GET /api/auth/me — current user. */
export const me = catchAsync(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  return ok(res, { user });
});

/**
 * POST /api/auth/forgot-password
 * Always responds 200 (no user enumeration). Sends a reset link over WhatsApp
 * if the phone matches an account.
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string };

  const user = await User.findOne({ phone });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
    await notifyStudent(user, {
      whatsapp: `🔐 رابط إعادة تعيين كلمة المرور (صالح لساعة): ${resetUrl}`,
    });
  }

  return ok(res, { message: 'If an account exists, a reset link has been sent.' });
});

/** POST /api/auth/reset-password */
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw ApiError.badRequest('Token is invalid or has expired');

  user.passwordHash = await hashPassword(password);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.tokenVersion += 1; // invalidate all existing refresh tokens
  await user.save();

  clearRefreshCookie(res);
  return ok(res, { message: 'Password updated. Please log in again.' });
});
