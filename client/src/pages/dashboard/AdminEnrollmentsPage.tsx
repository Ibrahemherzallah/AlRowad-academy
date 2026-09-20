import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, LinkIcon, Plus, Copy, Check, CreditCard, X, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import { formatPrice } from '@/lib/utils';
import { adminApi, type StudentRow, type PricePreview } from '@/lib/admin.api';
import type { Course } from '@/lib/types';

interface EnrollmentRow {
  _id: string;
  studentId: { name: string; phone: string } | null;
  courseId: { title: { ar: string; en: string }; slug: string } | null;
  amountPaid: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminEnrollmentsPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);

  // Connect form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [amount, setAmount] = useState(0);
  const [inviteCode, setInviteCode] = useState('');
  const [preview, setPreview] = useState<PricePreview | null>(null);

  // Inline payment
  const [addPaymentId, setAddPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [payingSaving, setPayingSaving] = useState(false);

  // Admin invite
  const [inviteCourseId, setInviteCourseId] = useState('');
  const [adminInvite, setAdminInvite] = useState<{ url: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([adminApi.students(), adminApi.courses(), adminApi.listEnrollments()])
        .then(([s, c, e]) => {
          setStudents(s);
          const pub = c.filter((x: Course) => x.status === 'published');
          setCourses(pub);
          setEnrollments(e as EnrollmentRow[]);
          if (pub[0] && !inviteCourseId) setInviteCourseId(pub[0]._id);
        })
        .finally(() => setLoading(false));
  };
  useEffect(loadAll, []);

  useEffect(() => {
    if (!courseId) { setPreview(null); return; }
    adminApi.pricePreview(courseId, amount || undefined)
        .then((p) => { setPreview(p); if (!amount) setAmount(0); })
        .catch(() => setPreview(null));
  }, [courseId, amount]);

  const connect = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentId || !courseId) { toast.error(t('common.error')); return; }
    setSaving(true);
    try {
      await adminApi.connectStudent({ studentId, courseId, amount, paymentMethod: 'cash', inviteCode: inviteCode || undefined });
      toast.success(t('admin.connected'));
      setStudentId(''); setCourseId(''); setAmount(0); setInviteCode(''); setPreview(null);
      setShowForm(false);
      loadAll();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || t('common.error'));
    } finally { setSaving(false); }
  };

  const addPayment = async (enrollmentId: string) => {
    if (paymentAmount <= 0) { toast.error(t('common.error')); return; }
    setPayingSaving(true);
    try {
      await adminApi.addPayment(enrollmentId, paymentAmount);
      toast.success(t('common.save'));
      setAddPaymentId(null); setPaymentAmount(0);
      loadAll();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || t('common.error'));
    } finally { setPayingSaving(false); }
  };

  const createInvite = async () => {
    if (!inviteCourseId) return;
    setCreatingInvite(true);
    try {
      const inv = await adminApi.createAdminInvite(inviteCourseId);
      setAdminInvite(inv as { url: string; code: string });
    } catch { toast.error(t('common.error')); }
    finally { setCreatingInvite(false); }
  };

  const copyInvite = async () => {
    if (!adminInvite) return;
    await navigator.clipboard.writeText(adminInvite.url);
    setCopied(true); toast.success(t('dashboard.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const statusVariant = (s: string) =>
      s === 'paid' ? 'success' : s === 'partial' ? 'accent' : 'muted';

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
      <div className="space-y-8">

        {/* ── 1. Header + connect button ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">{t('admin.navEnrollments')}</h2>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="size-4" /> : <UserPlus className="size-4" />}
            {t('admin.connectStudent')}
          </Button>
        </div>

        {/* ── Connect form (hidden by default) ── */}
        {showForm && (
            <Card className="p-6">
              <h3 className="mb-5 text-lg font-bold">{t('admin.connectStudent')}</h3>
              <form onSubmit={connect} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="student" label={t('admin.selectStudent')}>
                    <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                      <option value="">—</option>
                      {students.map((s) => (
                          <option key={s._id} value={s._id}>{s.name} ({s.phone})</option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="course" label={t('admin.selectCourse')}>
                    <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setAmount(0); }} required>
                      <option value="">—</option>
                      {courses.map((c) => (
                          <option key={c._id} value={c._id}>{loc(c.title)} — {formatPrice(c.price, i18n.language)}</option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field id="inviteCode" label={t('admin.inviteCode')}>
                  <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      dir="ltr" className="text-start uppercase" placeholder="XXXXXXXX"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('admin.teacherInvite')} · {t('admin.adminInviteLabel')} · {t('admin.studentInviteLabel')}
                  </p>
                </Field>

                {preview && (
                    <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-4 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('admin.shouldPay')}</p>
                        <p className="font-bold">{formatPrice(preview.total, i18n.language)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('admin.amountPaid')}</p>
                        <p className="font-bold text-primary">{formatPrice(amount, i18n.language)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('admin.remaining')}</p>
                        <p className="font-bold text-accent-foreground">{formatPrice(Math.max(0, preview.total - amount), i18n.language)}</p>
                      </div>
                    </div>
                )}

                <Field id="amount" label={`${t('admin.amountPaid')} (${t('admin.anyAmount')})`}>
                  <Input
                      type="number" min={0} value={amount}
                      onChange={(e) => setAmount(+e.target.value)}
                      dir="ltr" className="text-end"
                  />
                </Field>

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving || !studentId || !courseId}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
                    {t('admin.connect')}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </Card>
        )}

        {/* ── 2. Enrollments + payments ── */}
        {enrollments.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">{t('admin.noData')}</Card>
        ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="p-3 text-start font-semibold">{t('admin.student')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.studentNumber')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.course')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.paid')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.remaining')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.status')}</th>
                    <th className="p-3 text-start font-semibold">{t('admin.actions')}</th>
                  </tr>
                  </thead>
                  <tbody>
                  {enrollments.map((e) => (
                      <>
                        <tr key={e._id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3 font-medium">{e.studentId?.name ?? '—'}</td>
                          <td className="p-3 text-muted-foreground" dir="ltr">{e.studentId?.phone}</td>
                          <td className="p-3">{e.courseId ? loc(e.courseId.title) : '—'}</td>
                          <td className="p-3 font-semibold text-success">{formatPrice(e.amountPaid, i18n.language)}</td>
                          <td className="p-3 text-accent-foreground">{formatPrice(e.totalAmount - e.amountPaid, i18n.language)}</td>
                          <td className="p-3">
                            <Badge variant={statusVariant(e.paymentStatus)}>{e.paymentStatus}</Badge>
                          </td>
                          <td className="p-3">
                            <Button
                                size="sm" variant="outline"
                                onClick={() => { setAddPaymentId(addPaymentId === e._id ? null : e._id); setPaymentAmount(0); }}
                            >
                              <CreditCard className="size-3.5" />
                              {t('admin.addPayment')}
                            </Button>
                          </td>
                        </tr>

                        {/* Inline add-payment row */}
                        {addPaymentId === e._id && (
                            <tr key={`${e._id}-pay`} className="border-b border-border bg-primary/5">
                              <td colSpan={7} className="p-4">
                                <div className="flex items-end gap-3 max-w-sm">
                                  <Field id="payamt" label={t('admin.amountPaid')} className="flex-1">
                                    <Input
                                        type="number" min={1} value={paymentAmount}
                                        onChange={(ev) => setPaymentAmount(+ev.target.value)}
                                        dir="ltr" className="text-end"
                                    />
                                  </Field>
                                  <Button onClick={() => addPayment(e._id)} disabled={payingSaving}>
                                    {payingSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                                    {t('admin.payNow')}
                                  </Button>
                                  <Button variant="ghost" onClick={() => setAddPaymentId(null)}>✕</Button>
                                </div>
                                {e.totalAmount - e.amountPaid > 0 && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {t('admin.remaining')}: <strong>{formatPrice(e.totalAmount - e.amountPaid, i18n.language)}</strong>
                                    </p>
                                )}
                              </td>
                            </tr>
                        )}
                      </>
                  ))}
                  </tbody>
                </table>
              </div>
            </Card>
        )}

        {/* ── 3. Create admin invite link ── */}
        <div>
          <h2 className="mb-4 text-xl font-bold">{t('admin.adminInvite')}</h2>
          <Card className="max-w-2xl p-6 space-y-4">
            <div className="flex gap-3">
              <Select
                  value={inviteCourseId}
                  onChange={(e) => { setInviteCourseId(e.target.value); setAdminInvite(null); }}
                  className="flex-1"
              >
                {courses.map((c) => (
                    <option key={c._id} value={c._id}>{loc(c.title)}</option>
                ))}
              </Select>
              <Button onClick={createInvite} disabled={creatingInvite || !inviteCourseId}>
                {creatingInvite ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {t('admin.adminInvite')}
              </Button>
            </div>

            {adminInvite && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                  <span className="flex-1 truncate font-mono text-xs" dir="ltr">{adminInvite.url}</span>
                  <Button size="sm" variant="outline" onClick={copyInvite}>
                    {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  </Button>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
              {t('admin.adminInviteLabel')} — 2% {t('admin.commissionRate')}
            </p>
          </Card>
        </div>

      </div>
  );
}
