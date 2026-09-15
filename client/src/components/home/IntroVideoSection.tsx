import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Play, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, fadeUp } from '@/components/ui/reveal';

interface Props {
  /** YouTube video id. Replace with your platform intro. */
  youtubeId?: string;
  /** Optional custom poster image. */
  poster?: string;
}

/**
 * Intro video block — two columns: descriptive copy on one side, a compact
 * video on the other. Uses a click-to-play facade so the YouTube iframe only
 * mounts after the user clicks. Layout flips naturally in RTL/LTR.
 */
export function IntroVideoSection({ youtubeId = 'ysz5S6PUM-U', poster }: Props) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  const posterUrl = poster ?? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  const points = t('home.introVideoPoints', { returnObjects: true }) as string[];

  return (
    <section className="container py-16 md:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Copy side */}
        <Reveal>
          <span className="mb-3 inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
            <span className="h-px w-8 bg-gradient-to-r from-primary to-accent" />
            {t('home.introVideoEyebrow')}
          </span>
          <h2 className="text-3xl font-extrabold md:text-4xl">{t('home.introVideoTitle')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('home.introVideoSubtitle')}</p>

          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 font-medium">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="mt-8">
            <Link to="/register">
              {t('home.ctaRegister')}
              <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
            </Link>
          </Button>
        </Reveal>

        {/* Video side */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black shadow-xl">
            {playing ? (
              <iframe
                className="absolute inset-0 size-full"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={t('home.introVideoTitle')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 size-full"
                aria-label={t('home.watchNow')}
              >
                <img
                  src={posterUrl}
                  alt={t('home.introVideoTitle')}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                  }}
                />
                <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <Play className="size-7 translate-x-0.5" fill="currentColor" />
                  </span>
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
