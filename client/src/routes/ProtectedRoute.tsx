import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/lib/types';

interface Props {
  role?: Role;
}

/** Redirects unauthenticated users to /login; enforces role if provided. */
export function ProtectedRoute({ role }: Props) {
  const { user, status } = useAuthStore();
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role && user.role !== role) {
    // superadmin can access admin routes
    if (!(role === 'admin' && user.role === 'superadmin')) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
