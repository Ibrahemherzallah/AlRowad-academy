import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Props {
  value?: string;
  onChange: (url: string) => void;
}

/**
 * Click-to-upload image button. Opens the file picker, uploads to Bunny.net
 * via POST /api/upload/image, and calls onChange with the CDN URL.
 * Shows a preview thumbnail once uploaded.
 */
export function ImageUpload({ value, onChange }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG or WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const { data } = await api.post<{ success: boolean; data: { url: string } }>(
        '/upload/image',
        file,
        { headers: { 'Content-Type': file.type } },
      );
      onChange(data.data.url);
      toast.success(t('teacher.uploadSuccess'));
    } catch {
      toast.error(t('teacher.uploadError'));
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected if needed.
      e.target.value = '';
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />

      {value ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-border">
          <img src={value} alt="cover" className="aspect-video w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute end-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            onClick={pick}
            className="absolute bottom-2 end-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80"
          >
            {t('teacher.uploadImage')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-10 transition-colors hover:border-primary hover:bg-primary/5',
            uploading && 'cursor-wait opacity-60',
          )}
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-primary" />
          ) : (
            <ImagePlus className="size-8 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading ? t('teacher.uploading') : t('teacher.uploadImageHint')}
          </p>
        </button>
      )}
    </div>
  );
}
