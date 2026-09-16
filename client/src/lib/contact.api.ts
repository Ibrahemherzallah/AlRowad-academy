import { api, unwrap } from '@/lib/api';
import type { ApiEnvelope } from '@/lib/types';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function submitContact(payload: ContactPayload): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ id: string; message: string }>>(
    '/contact',
    payload,
  );
  return unwrap(data);
}
