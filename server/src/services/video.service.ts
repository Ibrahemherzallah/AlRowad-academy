import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Generic video-access interface. The rest of the app only calls
 * `signPlayback()` and never touches a provider SDK, so the backing provider
 * (Bunny.net today) can be swapped with no changes elsewhere.
 */

export interface SignedPlayback {
  /** HLS playlist URL the player streams from. */
  url: string;
  /** iframe embed URL (Bunny's player), also token-signed. */
  embedUrl: string;
  /** Unix seconds when the signed URL stops working. */
  expiresAt: number;
  provider: 'bunny' | 'fallback';
}

/** Whether Bunny is fully configured. If not, we use a dev fallback. */
function bunnyConfigured(): boolean {
  return Boolean(
    env.BUNNY_STREAM_LIBRARY_ID &&
      env.BUNNY_STREAM_CDN_HOST &&
      env.BUNNY_STREAM_TOKEN_KEY,
  );
}

/**
 * Bunny token authentication: sign a path with SHA256(token_key + path +
 * expiry). The signed token + expiry are appended as query params. This yields
 * a short-lived URL that can't be reshared past its expiry.
 * See Bunny docs: "Token Authentication".
 */
function signBunnyPath(path: string, expires: number): string {
  const tokenKey = env.BUNNY_STREAM_TOKEN_KEY as string;
  const hashInput = `${tokenKey}${path}${expires}`;
  const token = crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('base64')
    .replace(/\n/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return token;
}

/**
 * Produce a signed, expiring playback URL for a Bunny video GUID. Falls back to
 * a plain URL in development when Bunny isn't configured.
 *
 * @param videoId  Bunny Stream video GUID (or empty in dev)
 * @param fallbackUrl  lesson.videoUrl, used when Bunny isn't configured
 */
export function signPlayback(videoId: string, fallbackUrl = ''): SignedPlayback {
  const ttl = env.BUNNY_SIGNED_URL_TTL;
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;

  if (!bunnyConfigured() || !videoId) {
    // Dev / not-yet-configured: return the plain fallback URL unsigned.
    return {
      url: fallbackUrl,
      embedUrl: fallbackUrl,
      expiresAt,
      provider: 'fallback',
    };
  }

  const host = env.BUNNY_STREAM_CDN_HOST as string;
  const libraryId = env.BUNNY_STREAM_LIBRARY_ID as string;

  // HLS playlist path for the video.
  const hlsPath = `/${videoId}/playlist.m3u8`;
  const token = signBunnyPath(hlsPath, expiresAt);
  const url = `https://${host}${hlsPath}?token=${token}&expires=${expiresAt}`;

  // Token-signed iframe embed (Bunny player).
  const embedToken = signBunnyPath(`/embed/${libraryId}/${videoId}`, expiresAt);
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${embedToken}&expires=${expiresAt}`;

  return { url, embedUrl, expiresAt, provider: 'bunny' };
}

/**
 * Create a video entry in the Bunny library and return its GUID. Called when a
 * teacher/admin registers a new lesson video. In dev (no Bunny), returns ''.
 */
export async function createBunnyVideo(title: string): Promise<string> {
  if (!env.BUNNY_STREAM_LIBRARY_ID || !env.BUNNY_STREAM_API_KEY) {
    logger.info('[video] Bunny not configured — skipping remote video create');
    return '';
  }
  const res = await fetch(
    `https://video.bunnycdn.com/library/${env.BUNNY_STREAM_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: env.BUNNY_STREAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    },
  );
  if (!res.ok) {
    logger.error(`[video] Bunny create failed: ${res.status}`);
    throw new Error('Failed to create video');
  }
  const data = (await res.json()) as { guid: string };
  return data.guid;
}

/**
 * Return the direct upload URL + headers a teacher's browser can PUT the video
 * file to (TUS or simple PUT). Keeps the raw file off our server.
 */
export function bunnyUploadTarget(videoId: string): {
  uploadUrl: string;
  headers: Record<string, string>;
} | null {
  if (!env.BUNNY_STREAM_LIBRARY_ID || !env.BUNNY_STREAM_API_KEY) return null;
  return {
    uploadUrl: `https://video.bunnycdn.com/library/${env.BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`,
    headers: { AccessKey: env.BUNNY_STREAM_API_KEY },
  };
}
