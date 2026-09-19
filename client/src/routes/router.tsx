import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { StudentDashboardLayout } from '@/components/dashboard/StudentDashboardLayout';
import { AdminDashboardLayout } from '@/components/dashboard/AdminDashboardLayout';
import { TeacherDashboardLayout } from '@/components/dashboard/TeacherDashboardLayout';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import ContactPage from '@/pages/ContactPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import StudentOverviewPage from '@/pages/dashboard/StudentOverviewPage';
import AdminOverviewPage from '@/pages/dashboard/AdminOverviewPage';
import AdminTeachersPage from '@/pages/dashboard/AdminTeachersPage';
import AdminEnrollmentsPage from '@/pages/dashboard/AdminEnrollmentsPage';
import AdminCoursesPage from '@/pages/dashboard/AdminCoursesPage';
import AdminCourseStatsPage from '@/pages/dashboard/AdminCourseStatsPage';
import AdminStudentsPage from '@/pages/dashboard/AdminStudentsPage';
import StudentLoyaltyPage from '@/pages/dashboard/StudentLoyaltyPage';
import StudentReferralsPage from '@/pages/dashboard/StudentReferralsPage';
import StudentCoursesPage from '@/pages/dashboard/StudentCoursesPage';
import TeacherOverviewPage from '@/pages/teacher/TeacherOverviewPage';
import TeacherCoursesPage from '@/pages/teacher/TeacherCoursesPage';
import TeacherSchedulePage from '@/pages/teacher/TeacherSchedulePage';
import TeacherInvitesPage from '@/pages/teacher/TeacherInvitesPage';
import TeacherEarningsPage from '@/pages/teacher/TeacherEarningsPage';
import TeacherStudentsPage from '@/pages/teacher/TeacherStudentsPage';
import JoinCoursePage from '@/pages/JoinCoursePage';
import PlaceholderPage from '@/pages/PlaceholderPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Route table.
 *  - Public marketing pages render inside RootLayout (navbar + footer).
 *  - Auth pages use their own full-screen AuthLayout (outside RootLayout).
 *  - Student dashboard (/dashboard/*) and admin panel (/admin/*) use their own
 *    sidebar layouts, gated by ProtectedRoute (admin also role-gated).
 *  Sub-pages beyond each overview are placeholders, filled in incrementally.
 */
export const router = createBrowserRouter([
  // Full-screen auth pages
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Student dashboard
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <StudentDashboardLayout />,
        children: [
          { index: true, element: <StudentOverviewPage /> },
          { path: 'courses', element: <StudentCoursesPage /> },
          { path: 'sessions', element: <PlaceholderPage titleKey="dashboard.sessions" /> },
          { path: 'loyalty', element: <StudentLoyaltyPage /> },
          { path: 'referrals', element: <StudentReferralsPage /> },
          { path: 'profile', element: <PlaceholderPage titleKey="dashboard.profile" /> },
        ],
      },
    ],
  },

  // Teacher dashboard
  {
    element: <ProtectedRoute role="teacher" />,
    children: [
      {
        path: '/teacher',
        element: <TeacherDashboardLayout />,
        children: [
          { index: true, element: <TeacherOverviewPage /> },
          { path: 'courses', element: <TeacherCoursesPage /> },
          { path: 'schedule', element: <TeacherSchedulePage /> },
          { path: 'invites', element: <TeacherInvitesPage /> },
          { path: 'earnings', element: <TeacherEarningsPage /> },
          { path: 'students', element: <TeacherStudentsPage /> },
        ],
      },
    ],
  },

  // Admin panel
  {
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        path: '/admin',
        element: <AdminDashboardLayout />,
        children: [
          { index: true, element: <AdminOverviewPage /> },
          { path: 'courses', element: <AdminCoursesPage /> },
          { path: 'courses/:id/stats', element: <AdminCourseStatsPage /> },
          { path: 'teachers', element: <AdminTeachersPage /> },
          { path: 'students', element: <AdminStudentsPage /> },
          { path: 'enrollments', element: <AdminEnrollmentsPage /> },
          { path: 'offers', element: <PlaceholderPage titleKey="admin.navOffers" /> },
          { path: 'loyalty', element: <PlaceholderPage titleKey="admin.navLoyalty" /> },
          { path: 'sessions', element: <PlaceholderPage titleKey="admin.navSessions" /> },
          { path: 'services', element: <PlaceholderPage titleKey="admin.navServices" /> },
          { path: 'contact', element: <PlaceholderPage titleKey="admin.navContact" /> },
          { path: 'notifications', element: <PlaceholderPage titleKey="admin.navNotifications" /> },
          { path: 'settings', element: <PlaceholderPage titleKey="admin.navSettings" /> },
        ],
      },
    ],
  },

  // Public marketing site
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:slug', element: <CourseDetailPage /> },
      { path: 'join/:code', element: <JoinCoursePage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'services', element: <PlaceholderPage titleKey="nav.services" /> },
      { path: 'about', element: <PlaceholderPage titleKey="nav.about" /> },
      { path: 'forgot-password', element: <PlaceholderPage titleKey="auth.resetTitle" /> },
      { path: 'reset-password', element: <PlaceholderPage titleKey="auth.resetTitle" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
