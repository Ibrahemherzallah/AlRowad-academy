import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CreditCard,
  Tag,
  Gift,
  CalendarClock,
  Briefcase,
  MessageSquare,
  Bell,
  Settings,
} from 'lucide-react';
import { DashboardLayout, type NavItem } from './DashboardLayout';
import { api } from '@/lib/api';

/** Admin layout — fetches the unread-messages badge for the Messages item. */
export function AdminDashboardLayout() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api
      .get('/admin/contact/unread-count')
      .then((r) => setUnread(r.data?.data?.count ?? 0))
      .catch(() => setUnread(0));
  }, []);

  const nav: NavItem[] = [
    { to: '/admin', labelKey: 'admin.navOverview', icon: LayoutDashboard, end: true },
    { to: '/admin/courses', labelKey: 'admin.navCourses', icon: BookOpen },
    { to: '/admin/teachers', labelKey: 'admin.navTeachers', icon: GraduationCap },
    { to: '/admin/students', labelKey: 'admin.navStudents', icon: Users },
    { to: '/admin/enrollments', labelKey: 'admin.navEnrollments', icon: CreditCard },
    { to: '/admin/offers', labelKey: 'admin.navOffers', icon: Tag },
    { to: '/admin/loyalty', labelKey: 'admin.navLoyalty', icon: Gift },
    { to: '/admin/sessions', labelKey: 'admin.navSessions', icon: CalendarClock },
    { to: '/admin/services', labelKey: 'admin.navServices', icon: Briefcase },
    { to: '/admin/contact', labelKey: 'admin.navContact', icon: MessageSquare, badge: unread },
    { to: '/admin/notifications', labelKey: 'admin.navNotifications', icon: Bell },
    { to: '/admin/settings', labelKey: 'admin.navSettings', icon: Settings },
  ];

  return <DashboardLayout items={nav} titleKey="admin.panel" />;
}
