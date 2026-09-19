import { api, unwrap } from '@/lib/api';
import type { ApiEnvelope, LocalizedString } from '@/lib/types';

/* ---------- Student ---------- */

export interface StudentCourseSummary {
  enrollmentId: string;
  course: {
    _id: string;
    title: LocalizedString;
    slug: string;
    thumbnail?: string;
    category: string;
  } | null;
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'completed';
  paymentStatus: string;
  accessEndDate?: string | null;
}

export interface StudentOverview {
  name: string;
  stats: { enrolledCount: number; activeCount: number };
  courses: StudentCourseSummary[];
  loyalty: {
    pointsBalance: number;
    threshold: number;
    lifetimePointsEarned: number;
    voucherReady: boolean;
    activeVouchers: { code: string; discountPercent: number; expiresAt?: string | null }[];
  };
  upcomingSession: {
    _id: string;
    type: string;
    scheduledAt: string;
    duration: number;
  } | null;
  referral: { code: string; invited: number; converted: number };
}

export async function fetchStudentOverview(): Promise<StudentOverview> {
  const { data } = await api.get<ApiEnvelope<StudentOverview>>('/dashboard/student');
  return unwrap(data);
}

/* ---------- Admin ---------- */

export interface AdminOverview {
  totals: {
    students: number;
    courses: number;
    activeEnrollments: number;
    pendingPayments: number;
    upcomingSessions: number;
  };
  revenue: { allTime: number; thisMonth: number };
  recentEnrollments: {
    id: string;
    student: { name: string; phone: string } | null;
    course: { title: LocalizedString } | null;
    status: string;
    paymentStatus: string;
    amountPaid: number;
    createdAt: string;
  }[];
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const { data } = await api.get<ApiEnvelope<AdminOverview>>('/admin/dashboard');
  return unwrap(data);
}

/* ---------- Student loyalty ---------- */

export interface LoyaltyHistoryEntry {
  action: 'earned' | 'deducted' | 'redeemed' | 'manual_adjustment';
  points: number;
  reason: string;
  createdAt: string;
}

export interface StudentLoyalty {
  pointsBalance: number;
  threshold: number;
  lifetimePointsEarned: number;
  pointsPerEnrollment: number;
  pointsPerReferral: number;
  voucherDiscountPercent: number;
  history: LoyaltyHistoryEntry[];
  vouchers: { code: string; discountPercent: number; expiresAt?: string | null }[];
}

export async function fetchStudentLoyalty(): Promise<StudentLoyalty> {
  const { data } = await api.get<ApiEnvelope<StudentLoyalty>>('/dashboard/loyalty');
  return unwrap(data);
}

/* ---------- Student course detail (player) ---------- */

export interface StudentLesson {
  _id: string;
  title: string;
  duration: number;
  isFreePreview: boolean;
}

export interface StudentCourseDetail {
  title: LocalizedString;
  description: LocalizedString;
  thumbnail?: string;
  curriculum: { title: string; lessons: StudentLesson[] }[];
  accessEndDate?: string | null;
  expired: boolean;
}

export async function fetchStudentCourse(courseId: string): Promise<StudentCourseDetail> {
  const { data } = await api.get<ApiEnvelope<StudentCourseDetail>>(`/dashboard/courses/${courseId}`);
  return unwrap(data);
}
