import { api, unwrap } from '@/lib/api';
import type { ApiEnvelope } from '@/lib/types';

export interface Playback {
  url: string;
  embedUrl: string;
  expiresAt: number;
  provider: 'bunny' | 'fallback';
  lessonId: string;
  title: string;
  free: boolean;
}

/** Request a short-lived signed playback URL for a lesson. */
export async function fetchPlayback(lessonId: string): Promise<Playback> {
  const { data } = await api.get<ApiEnvelope<Playback>>(`/videos/${lessonId}/play`);
  return unwrap(data);
}
