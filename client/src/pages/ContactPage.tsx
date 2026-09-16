import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Loader2, Send } from 'lucide-react';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { toast } from '@/components/ui/toast';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { submitContact } from '@/lib/contact.api';

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{9,15}$/;

export default function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  useDocumentMeta({ title: t('contact.title'), description: t('contact.subtitle') });

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = t('validation.nameShort');
    if (!emailRegex.test(form.email)) e.email = t('validation.emailInvalid');
    if (form.phone && !phoneRegex.test(form.phone)) e.phone = t('validation.phoneInvalid');
    if (form.message.trim().length < 5) e.message = t('validation.messageShort');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });
      toast.success(t('contact.success'));
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      toast.error(t('contact.error'));
    } finally {
      setLoading(false);
    }
  };

  const info = [
    { icon: Mail, label: t('contact.emailLabel'), value: 'info@rawad.academy', dir: 'ltr' as const },
    { icon: Phone, label: t('contact.phoneLabel'), value: '+970 59 000 0000', dir: 'ltr' as const },
    { icon: MapPin, label: t('contact.addressLabel'), value: t('contact.address'), dir: undefined },
    { icon: Clock, label: t('contact.hoursLabel'), value: t('contact.hours'), dir: undefined },
  ] as const;

  return (
    <div className="container py-16 md:py-24">
      <Reveal className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold md:text-4xl">{t('contact.title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('contact.subtitle')}</p>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Info panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="h-full gradient-brand p-8 text-primary-foreground">
            <h2 className="text-xl font-bold">{t('contact.infoTitle')}</h2>
            <p className="mt-2 text-primary-foreground/80">{t('contact.infoSubtitle')}</p>

            <div className="mt-8 space-y-6">
              {info.map(({ icon: Icon, label, value, dir }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-foreground/70">{label}</p>
                    <p className="font-semibold" dir={dir}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Form panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3"
        >
          <Card className="p-8">
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label={t('contact.name')} error={errors.name}>
                  <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field id="email" label={t('contact.email')} error={errors.email}>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    dir="ltr"
                    className="text-start"
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="phone" label={t('contact.phone')} error={errors.phone}>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    dir="ltr"
                    className="text-start"
                    placeholder="+9705..."
                  />
                </Field>
                <Field id="subject" label={t('contact.subject')}>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => set('subject', e.target.value)}
                  />
                </Field>
              </div>

              <Field id="message" label={t('contact.message')} error={errors.message}>
                <Textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  placeholder={t('contact.messagePlaceholder')}
                />
              </Field>

              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {loading ? t('contact.sending') : t('contact.send')}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
