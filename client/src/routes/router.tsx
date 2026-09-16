import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from './ProtectedRoute';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import ContactPage from '@/pages/ContactPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Route table. Public pages render in RootLayout (navbar + footer).
 * Auth pages (login/register) use their own full-screen AuthLayout, so they
 * sit OUTSIDE RootLayout. Student/admin areas are gated by ProtectedRoute.
 */
export const router = createBrowserRouter([
  // Full-screen auth pages (no navbar/footer)
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:slug', element: <CourseDetailPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'services', element: <PlaceholderPage titleKey="nav.services" /> },
      { path: 'about', element: <PlaceholderPage titleKey="nav.about" /> },
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
