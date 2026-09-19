import {
  LayoutDashboard,
  BookOpen,
  CalendarClock,
  Gift,
  Users,
  UserCog,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from './DashboardLayout.tsx';

const STUDENT_NAV: NavItem[] = [
  { to: '/dashboard', labelKey: 'dashboard.student.navOverview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/courses', labelKey: 'dashboard.student.navCourses', icon: BookOpen },
  { to: '/dashboard/sessions', labelKey: 'dashboard.student.navSessions', icon: CalendarClock },
  { to: '/dashboard/loyalty', labelKey: 'dashboard.student.navLoyalty', icon: Gift },
  { to: '/dashboard/referrals', labelKey: 'dashboard.student.navReferrals', icon: Users },
  { to: '/dashboard/profile', labelKey: 'dashboard.student.navProfile', icon: UserCog },
];

export function StudentDashboardLayout() {
  return <DashboardLayout items={STUDENT_NAV} titleKey="nav.dashboard" />;
}
