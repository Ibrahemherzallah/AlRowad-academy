import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, Users, Check, Loader2, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { resolveInvite, reserveSeat, type InviteResolution } from '@/lib/enrollment.api';
import { useAuthStore } from '@/store/auth.store';

export default function JoinCoursePage() {
  const { code } = useParams<{ code: string }>();
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const dayNames = t('teacher.days_short', { returnObjects: true }) as string[];

  const [data, setData] = useState<InviteResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [scheduleId, setScheduleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) return;
    resolveInvite(code)
      .then((res) => {
        setData(res);
        const price = res.course.discountedPrice ?? res.course.price;
        setAmount(Math.ceil(price * 0.3));
        if (res.schedules[0]) setScheduleId(res.schedules[0]._id);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="container max-w-2xl py-16">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold">{t('common.error')}</h1>
        <Button asChild className="mt-6"><Link to="/courses">{t('nav.courses')}</Link></Button>
      </div>
    );
  }

  const price = data.course.discountedPrice ?? data.course.price;
  const minReserve = Math.ceil(price * 0.3);
  const remaining = Math.max(0, price - amount);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?next=/join/${code}`);
      return;
    }
    if (amount < minReserve) {
      toast.error(`${t('join.minReserve')}: ${formatPrice(minReserve, i18n.language)}`);
      return;
    }
    setSubmitting(true);
    try {
      await reserveSeat({
        courseId: data.course._id,
        amount,
        inviteCode: data.code,
        scheduleId: scheduleId || undefined,
        paymentMethod: 'cash',
      });
      toast.success(t('join.success'));
      navigate('/dashboard');
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          {/* Course header */}
          <div className="aspect-video bg-muted">
            {data.course.thumbnail ? (
              <img src={data.course.thumbnail} alt="" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center gradient-brand text-5xl font-bold text-primary-foreground/80">
                {loc(data.course.title).charAt(0)}
              </div>
            )}
          </div>

          <div className="p-6">
            <p className="text-sm text-muted-foreground">{t('join.invitedTo')}</p>
            <h1 className="mt-1 text-2xl font-extrabold">{loc(data.course.title)}</h1>
            <p className="mt-2 text-muted-foreground">{loc(data.course.description)}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {data.course.totalHours ? (
                <span className="flex items-center gap-1"><Clock className="size-4" />{data.course.totalHours} {t('teacher.hours')}</span>
              ) : null}
              <span className="flex items-center gap-1"><GraduationCap className="size-4" />{data.course.category}</span>
            </div>

            <div className="mt-4 text-2xl font-extrabold text-primary">
              {formatPrice(price, i18n.language)}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5 border-t border-border pt-6">
              <h2 className="text-lg font-bold">{t('join.reserveSeat')}</h2>
              <p className="text-sm text-muted-foreground">{t('join.reserveHint')}</p>

              {/* Schedule choice */}
              {data.schedules.length > 0 && (
                <Field id="schedule" label={t('join.chooseSchedule')}>
                  <div className="space-y-2">
                    {data.schedules.map((s) => (
                      <label
                        key={s._id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          scheduleId === s._id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="sched" checked={scheduleId === s._id} onChange={() => setScheduleId(s._id)} />
                          <div>
                            <p className="font-medium">{s.label || '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.days.map((d) => dayNames[d]).join('، ')} · <span dir="ltr">{s.startTime}–{s.endTime}</span>
                            </p>
                          </div>
                        </div>
                        {s.room && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" />{s.room}</span>}
                      </label>
                    ))}
                  </div>
                </Field>
              )}

              {/* Amount */}
              <Field id="amount" label={t('join.chooseAmount')}>
                <Input
                  type="number"
                  min={minReserve}
                  max={price}
                  value={amount}
                  onChange={(e) => setAmount(+e.target.value)}
                  dir="ltr"
                  className="text-end"
                />
              </Field>

              <div className="flex justify-between rounded-lg bg-muted/50 p-4 text-sm">
                <span>{t('join.minReserve')}: <strong>{formatPrice(minReserve, i18n.language)}</strong></span>
                <span>{t('join.remaining')}: <strong>{formatPrice(remaining, i18n.language)}</strong></span>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {user ? (submitting ? t('join.reserving') : t('join.confirm')) : t('join.loginToJoin')}
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
