import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Loader2, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneField } from '@/components/ui/phone-field';
import { toast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { adminApi, type TeacherRow } from '@/lib/admin.api';

export default function AdminTeachersPage() {
  const { t, i18n } = useTranslation();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '', specialty: '', commissionRate: 10 });

  const load = () => {
    setLoading(true);
    adminApi.teachers().then(setTeachers).catch(() => setTeachers([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createTeacher({
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        specialty: form.specialty.trim() || undefined,
        commissionRate: form.commissionRate / 100,
      });
      toast.success(t('common.save'));
      setShowForm(false);
      setForm({ name: '', phone: '', password: '', specialty: '', commissionRate: 10 });
      load();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const settle = async (id: string) => {
    try {
      await adminApi.settleTeacher(id);
      toast.success(t('admin.settled'));
      load();
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">{t('admin.teachers')}</h2>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {t('admin.addTeacher')}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="mb-4 font-bold">{t('admin.createTeacher')}</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name" label={t('auth.name')}>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </Field>
              <Field id="phone" label={t('auth.phone')}>
                <PhoneField value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="password" label={t('admin.password')}>
                <Input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} dir="ltr" className="text-end" required />
              </Field>
              <Field id="specialty" label={t('admin.specialty')}>
                <Input value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
              </Field>
              <Field id="commissionRate" label={`${t('admin.commissionRate')} (%)`}>
                <Input type="number" min={0} max={100} value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: +e.target.value }))} dir="ltr" />
              </Field>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </form>
        </Card>
      )}

      {teachers.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t('admin.noData')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((tc) => (
            <Card key={tc._id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                  {tc.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold">{tc.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{tc.phone}</p>
                </div>
              </div>
              {tc.specialty && <p className="mt-2 text-sm text-muted-foreground">{tc.specialty}</p>}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="font-bold">{tc.courseCount}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.courses')}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="font-bold text-accent-foreground">{formatPrice(tc.commissionOwed, i18n.language)}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.commissionOwed')}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="font-bold text-success">{formatPrice(tc.commissionPaid, i18n.language)}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.commissionPaid')}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="secondary">{Math.round((tc.commissionRate ?? 0.1) * 100)}%</Badge>
                {tc.commissionOwed > 0 && (
                  <Button size="sm" variant="outline" onClick={() => settle(tc._id)}>
                    <Wallet className="size-4" />
                    {t('admin.settle')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create marketing admin — superadmin only */}
      <CreateAdminSection />
    </div>
  );
}

function CreateAdminSection() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);

  if (user?.role !== 'superadmin') return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createAdmin(form);
      toast.success(t('admin.createAdmin'));
      setForm({ name: '', phone: '', password: '' });
      setShow(false);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || t('common.error'));
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t('admin.adminAccounts')}</h2>
        <Button size="sm" onClick={() => setShow((v) => !v)}>
          <Plus className="size-4" />{t('admin.createAdmin')}
        </Button>
      </div>
      {show && (
        <Card className="max-w-md p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field id="aname" label={t('admin.name')}>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </Field>
            <Field id="aphone" label={t('admin.phone')}>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} dir="ltr" required />
            </Field>
            <Field id="apass" label={t('admin.password')}>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} dir="ltr" required />
            </Field>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t('admin.createAdmin')}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
