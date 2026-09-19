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
import { postAuthDestination } from '@/lib/authRedirect';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  useDocumentMeta({ title: t('auth.loginTitle') });

  const next = params.get('next') || '/dashboard';

  const validate = () => {
    const e: typeof errors = {};
    // Expect at least a country code + a few digits (e.g. "+9705...").
    if (phone.replace(/\D/g, '').length < 8) e.phone = t('validation.phoneInvalid');
    if (password.length < 1) e.password = t('validation.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Backend treats a non-email identifier as a phone lookup.
      const user = await login(phone.trim(), password);
      toast.success(t('auth.loginSuccess'));
      navigate(postAuthDestination(user, params.get('next')), { replace: true });
    } catch (err) {
      const code = extractApiError(err);
      toast.error(code === 401 ? t('auth.invalidCredentials') : t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field id="phone" label={t('auth.phone')} error={errors.phone}>
          <PhoneField value={phone} onChange={setPhone} placeholder={t('auth.phone')} />
        </Field>

        <Field id="password" label={t('auth.password')} error={errors.password}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? t('auth.loggingIn') : t('auth.submitLogin')}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link
            to={next !== '/dashboard' ? `/register?next=${next}` : '/register'}
            className="font-semibold text-primary hover:underline"
          >
            {t('auth.registerTitle')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
