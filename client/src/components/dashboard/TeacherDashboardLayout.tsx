import {
  LayoutDashboard,
  BookOpen,
  CalendarClock,
  Link2,
  Wallet,
  Users,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from './DashboardLayout';

const TEACHER_NAV: NavItem[] = [
  { to: '/teacher', labelKey: 'teacher.navOverview', icon: LayoutDashboard, end: true },
  { to: '/teacher/courses', labelKey: 'teacher.navCourses', icon: BookOpen },
  { to: '/teacher/schedule', labelKey: 'teacher.navSchedule', icon: CalendarClock },
  { to: '/teacher/invites', labelKey: 'teacher.navInvites', icon: Link2 },
  { to: '/teacher/earnings', labelKey: 'teacher.navEarnings', icon: Wallet },
  { to: '/teacher/students', labelKey: 'teacher.navStudents', icon: Users },
];

export function TeacherDashboardLayout() {
  return <DashboardLayout items={TEACHER_NAV} titleKey="teacher.panel" />;
}
