import { useTranslation } from 'react-i18next';

interface Props {
  /** Seconds for one full loop. Lower = faster. */
  duration?: number;
}

/**
 * Infinite auto-scrolling keyword strip ("what we provide"). Content is
 * duplicated so the CSS translateX(-50%) loop is seamless. Pauses on hover
 * and fades at both edges. Direction-agnostic — reads fine in RTL and LTR.
 */
export function ProvideMarquee({ duration = 40 }: Props) {
  const { t, i18n } = useTranslation();
  const items = t('home.marquee', { returnObjects: true }) as string[];
  const loop = [...items, ...items];
  const isRtl = i18n.dir() === 'rtl';

  return (
    <div className="relative border-y border-border bg-card/60 py-4 backdrop-blur">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

      <div className="group flex overflow-hidden">
        <div
          className={`flex shrink-0 items-center gap-8 pe-8 group-hover:[animation-play-state:paused] motion-reduce:animate-none ${
            isRtl ? 'animate-marquee-rtl' : 'animate-marquee'
          }`}
          style={{ ['--marquee-duration' as string]: `${duration}s` }}
        >
          {loop.map((item, i) => (
            <span key={i} className="flex items-center gap-8 text-sm font-semibold text-muted-foreground">
              <span className="whitespace-nowrap transition-colors hover:text-primary">{item}</span>
              <span className="size-1.5 shrink-0 rounded-full bg-primary/50" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
