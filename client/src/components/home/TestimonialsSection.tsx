import { useTranslation } from 'react-i18next';
import { Quote, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Reveal, RevealGroup, fadeUp } from '@/components/ui/reveal';
import { motion } from 'framer-motion';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export function TestimonialsSection() {
  const { t } = useTranslation();
  const items = t('home.testimonials', { returnObjects: true }) as Testimonial[];

  return (
    <section className="bg-secondary/40 py-16 md:py-24">
      <div className="container">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold md:text-3xl">{t('home.testimonialsTitle')}</h2>
          <p className="mt-3 text-muted-foreground">{t('home.testimonialsSubtitle')}</p>
        </Reveal>

        <RevealGroup className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="relative flex h-full flex-col p-6">
                <Quote className="absolute end-6 top-6 size-8 text-primary/15" />
                <div className="mb-4 flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-4" fill="currentColor" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                  “{item.quote}”
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                  <div className="grid size-11 place-items-center rounded-full gradient-brand text-lg font-bold text-primary-foreground">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
