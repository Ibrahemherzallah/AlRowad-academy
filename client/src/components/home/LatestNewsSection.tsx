import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal, RevealGroup, fadeUp } from '@/components/ui/reveal';

interface NewsItem {
  title: string;
  date: string;
  excerpt: string;
}

export function LatestNewsSection() {
  const { t } = useTranslation();
  const items = t('home.news', { returnObjects: true }) as NewsItem[];

  return (
    <section className="bg-secondary/40 py-16 md:py-24">
      <div className="container">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold md:text-3xl">{t('home.newsTitle')}</h2>
          <p className="mt-3 text-muted-foreground">{t('home.newsSubtitle')}</p>
        </Reveal>

        <RevealGroup className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="group flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative aspect-[16/9] overflow-hidden gradient-brand">
                  <div className="absolute inset-0 grid place-items-center text-5xl font-extrabold text-primary-foreground/20">
                    {i + 1}
                  </div>
                  <Badge variant="accent" className="absolute top-3 start-3">
                    <CalendarDays className="me-1 size-3" />
                    {item.date}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-bold leading-snug transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {item.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {t('home.readArticle')}
                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1 rtl:rotate-0 ltr:rotate-180" />
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
