import { api, unwrap } from '@/lib/api';
import type { ApiEnvelope, Course, LocalizedString } from '@/lib/types';

export interface TeacherOverview {
  courseCount: number;
  studentCount: number;
  earnings: TeacherEarnings;
  upcomingBlocks: number;
}

export interface TeacherEarnings {
  totalAccrued: number;
  totalPaid: number;
  pending: number;
  lifetime: number;
  perCourse: {
    course: { title: LocalizedString; slug: string } | null;
    earned: number;
    studentCount: number;
  }[];
}

export interface ScheduleBlock {
  id: string;
  label: string;
  course: { title: LocalizedString; slug: string; totalHours?: number } | null;
  days: number[];
  startTime: string;
  endTime: string;
  room?: string;
  capacity?: number | null;
  enrolled: number;
}

export interface TeacherSchedule {
  blocks: ScheduleBlock[];
  byDay: Record<number, ScheduleBlock[]>;
}

export interface InviteLink {
  _id: string;
  code: string;
  url: string;
  courseId: { title: LocalizedString; slug: string } | string;
  uses: number;
  isActive: boolean;
}

export const teacherApi = {
  overview: async () =>
    unwrap((await api.get<ApiEnvelope<TeacherOverview>>('/teacher/overview')).data),
  courses: async () => unwrap((await api.get<ApiEnvelope<Course[]>>('/teacher/courses')).data),
  createCourse: async (payload: Record<string, unknown>) =>
    unwrap((await api.post<ApiEnvelope<Course>>('/teacher/courses', payload)).data),
  updateCourse: async (id: string, payload: Record<string, unknown>) =>
    unwrap((await api.patch<ApiEnvelope<Course>>(`/teacher/courses/${id}`, payload)).data),
  schedule: async () =>
    unwrap((await api.get<ApiEnvelope<TeacherSchedule>>('/teacher/schedule')).data),
  createSchedule: async (payload: Record<string, unknown>) =>
    unwrap((await api.post<ApiEnvelope<ScheduleBlock>>('/teacher/schedules', payload)).data),
  deleteSchedule: async (id: string) => api.delete(`/teacher/schedules/${id}`),
  invites: async () => unwrap((await api.get<ApiEnvelope<InviteLink[]>>('/teacher/invites')).data),
  createInvite: async (courseId: string) =>
    unwrap((await api.post<ApiEnvelope<InviteLink>>('/teacher/invites', { courseId })).data),
  earnings: async () =>
    unwrap((await api.get<ApiEnvelope<TeacherEarnings>>('/teacher/earnings')).data),
  students: async () => unwrap((await api.get<ApiEnvelope<unknown[]>>('/teacher/students')).data),
  getCourse: async (id: string) =>
    unwrap((await api.get<ApiEnvelope<{
      course: Course;
      students: {
        id: string;
        student: { name: string; phone: string; city?: string } | null;
        amountPaid: number;
        totalAmount: number;
        paymentStatus: string;
        createdAt: string;
      }[];
    }>>(`/teacher/courses/${id}`)).data),
  updateLessons: async (courseId: string, lessons: { title: string; videoUrl: string; isFreePreview?: boolean }[]) =>
    unwrap((await api.patch<ApiEnvelope<Course>>(`/teacher/courses/${courseId}/lessons`, { lessons })).data),
};
