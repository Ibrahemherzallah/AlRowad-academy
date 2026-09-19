import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useTranslation } from 'react-i18next';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { fetchPlayback, type Playback } from '@/lib/video.api';
import { extractApiError } from '@/lib/errors';

interface Props {
  lessonId: string;
  poster?: string;
}

/**
 * Streams a lesson video via a short-lived signed URL from our backend.
 * The backend authorizes access (enrollment active + within window) before
 * signing, so an unauthorized viewer never receives a playable URL.
 */
export function VideoPlayer({ lessonId, poster }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading');

  // Fetch a fresh signed URL whenever the lesson changes.
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchPlayback(lessonId)
      .then((pb) => {
        if (cancelled) return;
        setPlayback(pb);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        const code = extractApiError(err);
        setStatus(code === 403 || code === 401 ? 'forbidden' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  // Attach HLS (or native) once we have a direct URL and a <video> element.
  useEffect(() => {
    if (status !== 'ready' || !playback) return;
    // Bunny embeds are handled by the iframe branch below.
    const isHls = playback.url.includes('.m3u8');
    const video = videoRef.current;
    if (!video || !isHls) return;

    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls({ xhrSetup: () => {} });
      hls.loadSource(playback.url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari plays HLS natively.
      video.src = playback.url;
    }
    return () => {
      hls?.destroy();
    };
  }, [status, playback]);

  if (status === 'loading') {
    return (
      <div className="grid aspect-video place-items-center rounded-xl bg-black text-white">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-muted text-center">
        <Lock className="size-10 text-muted-foreground" />
        <p className="font-semibold">{t('dashboard.accessExpired')}</p>
      </div>
    );
  }

  if (status === 'error' || !playback) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-muted text-center">
        <AlertCircle className="size-10 text-destructive" />
        <p className="text-muted-foreground">{t('common.error')}</p>
      </div>
    );
  }

  // Bunny iframe embed (when provider is bunny and we use the embed URL).
  const useEmbed = playback.provider === 'bunny' && !playback.url.includes('.m3u8');
  if (useEmbed) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={playback.embedUrl}
          title={playback.title}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      </div>
    );
  }

  // Fallback: a plain URL (dev / external mp4) that isn't HLS.
  const isHls = playback.url.includes('.m3u8');
  if (!isHls && playback.url) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} src={playback.url} poster={poster} controls controlsList="nodownload" className="size-full" />
      </div>
    );
  }

  // HLS via hls.js / native.
  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black">
      <video ref={videoRef} poster={poster} controls controlsList="nodownload" className="size-full" />
    </div>
  );
}
