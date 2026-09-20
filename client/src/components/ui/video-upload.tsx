import { useRef, useState } from 'react';

import { Video, Loader2, CheckCircle2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Props {
  lessonTitle: string;
  onUploaded: (bunnyVideoId: string) => void;
}

/**
 * Teacher video upload button.
 * Flow: (1) POST /api/upload/video-init → get Bunny videoId + upload URL
 *       (2) PUT file directly to Bunny from the browser (no server proxy)
 *       (3) Call onUploaded(videoId) so the parent saves it on the lesson
 */
export function VideoUpload({ lessonTitle, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
      toast.error('Please upload a video file (MP4, WebM, MOV)');
      return;
    }

    setStatus('uploading');
    setProgress(0);

    try {
      // Step 1: create video entry in Bunny and get upload URL
      const initRes = await api.post<{
        success: boolean;
        data: { videoId: string; uploadTarget: { uploadUrl: string; headers: Record<string, string> } | null };
      }>('/upload/video-init', { title: lessonTitle || file.name });

      const { videoId, uploadTarget } = initRes.data.data;

      if (!uploadTarget) {
        toast.error('Bunny Stream not configured on the server');
        setStatus('error');
        return;
      }

      // Step 2: upload directly to Bunny via XHR (for progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadTarget.uploadUrl);
        Object.entries(uploadTarget.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      setStatus('done');
      setProgress(100);
      toast.success('Video uploaded — Bunny is processing it (takes a few minutes)');
      onUploaded(videoId);
    } catch (err) {
      console.error(err);
      setStatus('error');
      toast.error('Video upload failed');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.avi,.mkv" className="hidden" onChange={onFile} />

      {status === 'done' ? (
        <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="size-4" />
          <span>تم رفع الفيديو بنجاح — Bunny يعالجه الآن</span>
          <button onClick={() => setStatus('idle')} className="ms-auto"><X className="size-4" /></button>
        </div>
      ) : status === 'uploading' ? (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>جارٍ الرفع... {progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary',
            status === 'error' && 'border-destructive/50 text-destructive',
          )}
        >
          <Video className="size-4" />
          {status === 'error' ? 'فشل الرفع — اضغط للمحاولة مجدداً' : 'رفع فيديو الدرس (MP4, MOV, WebM)'}
        </button>
      )}
    </div>
  );
}
