import { api, unwrap } from '@/lib/api';
import type { ApiEnvelope, Course, LocalizedString } from '@/lib/types';

export interface InviteResolution {
  code: string;
  course: Course;
  schedules: {
    _id: string;
    label: string;
    days: number[];
    startTime: string;
    endTime: string;
    room?: string;
  }[];
}

export async function resolveInvite(code: string): Promise<InviteResolution> {
  const { data } = await api.get<ApiEnvelope<InviteResolution>>(`/invites/${code}`);
  return unwrap(data);
}

export interface ReservePayload {
  courseId: string;
  amount: number;
  inviteCode?: string;
  scheduleId?: string;
  paymentMethod?: 'online' | 'bank_transfer' | 'cash';
}

export async function reserveSeat(payload: ReservePayload) {
  const { data } = await api.post<ApiEnvelope<unknown>>('/enrollments/reserve', payload);
  return unwrap(data);
}

export interface StudentInvite {
  _id: string;
  code: string;
  url: string;
  courseId: { title: LocalizedString; slug: string } | string;
  uses: number;
}

export async function myStudentInvites(): Promise<StudentInvite[]> {
  const { data } = await api.get<ApiEnvelope<StudentInvite[]>>('/enrollments/my-invites');
  return unwrap(data);
}

export async function createStudentInvite(courseId: string): Promise<StudentInvite> {
  const { data } = await api.post<ApiEnvelope<StudentInvite>>('/enrollments/my-invites', { courseId });
  return unwrap(data);
}
