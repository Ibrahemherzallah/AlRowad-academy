import { type ComponentType } from 'react';
import { motion } from 'framer-motion';
import { type LucideProps } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<LucideProps>;
  /** Tailwind color family, e.g. 'primary' | 'accent' | 'success'. */
  tone?: 'primary' | 'accent' | 'success' | 'destructive';
  index?: number;
}

const TONES = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/15 text-accent-foreground',
  success: 'bg-success/15 text-success',
  destructive: 'bg-destructive/10 text-destructive',
} as const;

export function StatCard({ label, value, icon: Icon, tone = 'primary', index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Card className="flex items-center gap-4 p-5">
        <div className={cn('grid size-12 shrink-0 place-items-center rounded-xl', TONES[tone])}>
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-extrabold">{value}</p>
        </div>
      </Card>
    </motion.div>
  );
}
