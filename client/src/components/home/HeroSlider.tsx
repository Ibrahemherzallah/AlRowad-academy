import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface HeroSlide {
  /** Background image URL. */
  image: string;
  /** Optional short caption shown as a small pill above nothing — kept minimal. */
  alt?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  /** Autoplay interval in ms. Set 0 to disable. */
  interval?: number;
  className?: string;
}

/**
 * Auto-advancing hero carousel. Crossfades between slides, pauses on hover,
 * respects prefers-reduced-motion, and mirrors its arrow controls in RTL.
 */
export function HeroSlider({ slides, interval = 5500, className }: HeroSliderProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = slides.length;
  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Autoplay
  useEffect(() => {
    if (!interval || paused || count <= 1) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    timer.current = setInterval(() => setIndex((p) => (p + 1) % count), interval);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [interval, paused, count]);

  if (count === 0) return null;

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Slides */}
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ opacity: { duration: 1 }, scale: { duration: 6, ease: 'linear' } }}
          className="absolute inset-0"
        >
          <img
            src={slides[index].image}
            alt={slides[index].alt ?? ''}
            className="size-full object-cover"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient veil so overlaid text stays readable in both themes */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {count > 1 && (
        <>
          {/* Arrows — logical placement, mirrored automatically via start/end */}
          <button
            type="button"
            onClick={isRtl ? next : prev}
            aria-label="Previous slide"
            className="group absolute start-4 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/60 p-2 backdrop-blur transition-colors hover:bg-background/90 md:grid"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={isRtl ? prev : next}
            aria-label="Next slide"
            className="group absolute end-4 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/60 p-2 backdrop-blur transition-colors hover:bg-background/90 md:grid"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 start-1/2 z-10 flex -translate-x-1/2 gap-2 rtl:translate-x-1/2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === index ? 'w-7 bg-primary' : 'w-2 bg-foreground/30 hover:bg-foreground/50',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
