import type { User } from '@/lib/types';

/**
 * Where to send a user right after login/register.
 * An explicit `next` (e.g. returning to checkout) always wins; otherwise route
 * by role — admins to the admin panel, students to their dashboard.
 */
export function postAuthDestination(user: User, next?: string | null): string {
  if (next && next !== '/dashboard') return next;
  if (user.role === 'admin' || user.role === 'superadmin') return '/admin';
  if (user.role === 'teacher') return '/teacher';
  return '/dashboard';
}
