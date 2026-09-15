import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from './ProtectedRoute';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Route table. Public pages render in RootLayout. Student/admin areas are
 * gated by ProtectedRoute and get their own layouts in later modules.
 * Placeholder pages are swapped out as feature modules land.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:slug', element: <CourseDetailPage /> },
      { path: 'services', element: <PlaceholderPage titleKey="nav.services" /> },
      { path: 'about', element: <PlaceholderPage titleKey="nav.about" /> },
      { path: 'login', element: <PlaceholderPage titleKey="auth.loginTitle" /> },
      { path: 'register', element: <PlaceholderPage titleKey="auth.registerTitle" /> },
      { path: 'forgot-password', element: <PlaceholderPage titleKey="auth.resetTitle" /> },
      { path: 'reset-password', element: <PlaceholderPage titleKey="auth.resetTitle" /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <PlaceholderPage titleKey="nav.dashboard" /> },
        ],
      },
      {
        element: <ProtectedRoute role="admin" />,
        children: [{ path: 'admin', element: <PlaceholderPage titleKey="nav.admin" /> }],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
