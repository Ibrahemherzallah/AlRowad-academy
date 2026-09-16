import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PhoneField } from '@/components/ui/phone-field';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth.store';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { extractApiError } from '@/lib/errors';

interface FormState {
  name: string;
  phone: string;
  password: string;
  city: string;
  referralCode: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const phoneRegex = /^\+?[0-9]{9,15}$/;

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const registerUser = useAuthStore((s) => s.register);

  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    password: '',
    city: '',
    referralCode: params.get('ref') ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useDocumentMeta({ title: t('auth.registerTitle') });

  const next = params.get('next') || '/dashboard';

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = t('validation.nameShort');
    if (!phoneRegex.test(form.phone)) e.phone = t('validation.phoneInvalid');
    if (form.password.length < 8) e.password = t('validation.passwordShort');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await registerUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        city: form.city.trim() || undefined,
        referralCode: form.referralCode.trim() || undefined,
      });
      toast.success(t('auth.registerSuccess'));
      navigate(next, { replace: true });
    } catch (err) {
      const code = extractApiError(err);
      toast.error(code === 409 ? t('auth.phoneTaken') : t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field id="name" label={t('auth.name')} error={errors.name}>
          <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder={t('auth.namePlaceholder')} />
        </Field>

        <Field id="phone" label={t('auth.phone')} error={errors.phone}>
          <PhoneField
            value={form.phone}
            onChange={(v) => set('phone', v)}
            placeholder={t('auth.phone')}
          />
        </Field>

        <Field id="password" label={t('auth.password')} error={errors.password}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
              dir="ltr"
              className="text-end pe-10"
              placeholder={t('auth.passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="toggle password"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="city" label={t('auth.city')}>
            <Input id="city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder={t('auth.cityPlaceholder')} />
          </Field>
          <Field id="referralCode" label={t('auth.referralCode')}>
            <Input
              id="referralCode"
              value={form.referralCode}
              onChange={(e) => set('referralCode', e.target.value)}
              dir="ltr"
              className="text-end uppercase"
              placeholder={t('auth.referralPlaceholder')}
            />
          </Field>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? t('auth.creating') : t('auth.submitRegister')}
        </Button>

        <p className="text-center text-xs text-muted-foreground">{t('auth.agreeTerms')}</p>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link
            to={next !== '/dashboard' ? `/login?next=${next}` : '/login'}
            className="font-semibold text-primary hover:underline"
          >
            {t('auth.loginTitle')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
