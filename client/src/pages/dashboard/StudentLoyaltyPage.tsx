import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Gift, Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudentLoyalty, type StudentLoyalty } from '@/lib/dashboard.api';

export default function StudentLoyaltyPage() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<StudentLoyalty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentLoyalty().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-muted-foreground">{t('common.error')}</p>;

  const pct = Math.min(100, Math.round((data.pointsBalance / data.threshold) * 100));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">{t('dashboard.myPoints')}</h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Points widget */}
        <Card className="overflow-hidden lg:col-span-1">
          <div className="gradient-brand p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold"><Gift className="size-5" />{t('dashboard.loyaltyPoints')}</span>
              {data.vouchers.length > 0 && (
                <Badge variant="accent" className="gap-1"><Sparkles className="size-3" />{t('dashboard.voucherReady')}</Badge>
              )}
            </div>
            <p className="mt-4 text-4xl font-extrabold">
              {data.pointsBalance}<span className="text-lg font-medium opacity-70"> / {data.threshold}</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-white" />
            </div>
            <p className="mt-3 flex items-center gap-1 text-sm opacity-80">
              <TrendingUp className="size-4" />
              {t('dashboard.earned')}: {data.lifetimePointsEarned} {t('dashboard.points')}
            </p>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground">{t('dashboard.pointsRule')}</p>
          </div>
        </Card>

        {/* Vouchers + history */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-3 font-bold">{t('dashboard.activeVouchers')}</h3>
            {data.vouchers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noVouchers')}</p>
            ) : (
              <div className="space-y-2">
                {data.vouchers.map((v) => (
                  <div key={v.code} className="flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                    <span className="font-mono font-bold text-primary" dir="ltr">{v.code}</span>
                    <Badge variant="success">{v.discountPercent}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-border px-5 py-3 font-bold">{t('dashboard.pointsHistory')}</div>
            {data.history.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">{t('admin.noData')}</p>
            ) : (
              <div className="divide-y divide-border">
                {data.history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`grid size-8 place-items-center rounded-full ${h.points >= 0 ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {h.points >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{h.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${h.points >= 0 ? 'text-success' : 'text-muted-foreground'}`}>
                      {h.points >= 0 ? '+' : ''}{h.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
