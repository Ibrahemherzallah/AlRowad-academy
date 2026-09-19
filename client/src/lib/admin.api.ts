import { api, unwrap } from '@/lib/api';
import type { ApiEnvelope, Course, LocalizedString, User } from '@/lib/types';

export interface TeacherRow extends User {
  courseCount: number;
  commissionOwed: number;
  commissionPaid: number;
  commissionRate?: number;
  specialty?: string;
}

export interface StudentRow extends User {
  enrollmentCount: number;
  totalPaid: number;
  totalOwed: number;
}

export interface PricePreview {
  total: number;
  minReservation: number;
  minPercent: number;
  paying: number;
  remaining: number;
}

export interface CourseStats {
  course: { id: string; title: LocalizedString; teacher: { name: string } | null };
  students: {
    student: { name: string; phone: string } | null;
    paid: number;
    total: number;
    remaining: number;
    paymentStatus: string;
    viaInvite: boolean;
  }[];
  totals: {
    enrolled: number;
    revenue: number;
    outstanding: number;
    discountsGiven: number;
    teacherCommissionOwed: number;
    teacherCommissionPaid: number;
  };
}

export const adminApi = {
  teachers: async () => unwrap((await api.get<ApiEnvelope<TeacherRow[]>>('/admin/teachers')).data),
  createTeacher: async (payload: Record<string, unknown>) =>
    unwrap((await api.post<ApiEnvelope<User>>('/admin/teachers', payload)).data),
  settleTeacher: async (id: string) => api.post(`/admin/teachers/${id}/settle`),

  students: async () => unwrap((await api.get<ApiEnvelope<StudentRow[]>>('/admin/students')).data),
  courses: async () => unwrap((await api.get<ApiEnvelope<Course[]>>('/admin/courses')).data),
  updateCourse: async (id: string, payload: Record<string, unknown>) =>
    unwrap((await api.patch<ApiEnvelope<Course>>(`/admin/courses/${id}`, payload)).data),
  deleteCourse: async (id: string) => api.delete(`/admin/courses/${id}`),

  pricePreview: async (courseId: string, amount?: number) =>
    unwrap(
      (await api.get<ApiEnvelope<PricePreview>>('/admin/enrollments/price-preview', {
        params: { courseId, amount },
      })).data,
    ),
  connectStudent: async (payload: Record<string, unknown>) =>
    unwrap((await api.post<ApiEnvelope<unknown>>('/admin/enrollments/connect', payload)).data),
  addPayment: async (enrollmentId: string, amount: number, paymentMethod?: string) =>
    unwrap(
      (await api.post<ApiEnvelope<unknown>>(`/admin/enrollments/${enrollmentId}/payment`, {
        amount,
        paymentMethod,
      })).data,
    ),

  courseStats: async (id: string) =>
    unwrap((await api.get<ApiEnvelope<CourseStats>>(`/admin/courses/${id}/stats`)).data),
};
