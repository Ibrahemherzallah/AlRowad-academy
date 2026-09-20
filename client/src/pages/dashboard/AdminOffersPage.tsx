import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Loader2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useLocalized } from '@/hooks/useLocalized';
import { adminApi } from '@/lib/admin.api';
import type { Course } from '@/lib/types';

interface Discount {
  _id: string;
  label: string;
  type: 'percent' | 'fixed';
  value: number;
  scope: 'all' | 'category' | 'courses';
  category?: string;
  courseIds?: string[];
  isActive: boolean;
  expiresAt?: string | null;
}

interface Category { ar: string; en: string; }

export default function AdminOffersPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    label: '', type: 'percent' as 'percent' | 'fixed', value: 10,
    scope: 'all' as 'all' | 'category' | 'courses',
    category: '', courseIds: [] as string[], expiresAt: '',
  });

  const load = () => {
    Promise.all([adminApi.listDiscounts(), adminApi.courses(), adminApi.listCategories()])
      .then(([d, c, cats]) => {
        setDiscounts(d as Discount[]);
        setCourses(c as Course[]);
        setCategories(cats as Category[]);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setF = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.label || form.value <= 0) { toast.error(t('validation.required')); return; }
    setSaving(true);
    try {
      await adminApi.createDiscount({
        label: form.label,
        type: form.type,
        value: form.value,
        scope: form.scope,
        category: form.scope === 'category' ? form.category : undefined,
        courseIds: form.scope === 'courses' ? form.courseIds : [],
        expiresAt: form.expiresAt || null,
        isActive: true,
      });
      toast.success(t('common.save'));
      setShowForm(false);
      setForm({ label: '', type: 'percent', value: 10, scope: 'all', category: '', courseIds: [], expiresAt: '' });
      load();
    } catch { toast.error(t('common.error')); }
    finally { setSaving(false); }
  };

  const toggle = async (d: Discount) => {
    try {
      await adminApi.updateDiscount(d._id, { isActive: !d.isActive });
      load();
    } catch { toast.error(t('common.error')); }
  };

  const del = async (id: string) => {
    try { await adminApi.deleteDiscount(id); load(); }
    catch { toast.error(t('common.error')); }
  };

  const toggleCourse = (id: string) =>
    setF('courseIds', form.courseIds.includes(id) ? form.courseIds.filter((x) => x !== id) : [...form.courseIds, id]);

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">{t('admin.navOffers')}</h2>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" />{t('admin.addDiscount')}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 max-w-2xl">
          <form onSubmit={submit} className="space-y-4">
            <Field id="dlabel" label={t('admin.discountLabel')}>
              <Input value={form.label} onChange={(e) => setF('label', e.target.value)} placeholder="عرض رمضان" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="dtype" label={t('admin.discountType') || 'نوع الخصم'}>
                <Select value={form.type} onChange={(e) => setF('type', e.target.value)}>
                  <option value="percent">{t('admin.discountPercent')}</option>
                  <option value="fixed">{t('admin.discountFixed')}</option>
                </Select>
              </Field>
              <Field id="dval" label={form.type === 'percent' ? `${t('admin.discountPercent')} (%)` : t('admin.discountFixed')}>
                <Input type="number" min={0} max={form.type === 'percent' ? 100 : undefined} value={form.value} onChange={(e) => setF('value', +e.target.value)} dir="ltr" />
              </Field>
              <Field id="dexpiry" label={t('admin.discountExpiry')}>
                <Input type="date" value={form.expiresAt} onChange={(e) => setF('expiresAt', e.target.value)} dir="ltr" />
              </Field>
            </div>
            <Field id="dscope" label={t('admin.discountScope')}>
              <Select value={form.scope} onChange={(e) => setF('scope', e.target.value)}>
                <option value="all">{t('admin.discountScopeAll')}</option>
                <option value="category">{t('admin.discountScopeCategory')}</option>
                <option value="courses">{t('admin.discountScopeCourses')}</option>
              </Select>
            </Field>
            {form.scope === 'category' && (
              <Field id="dcat" label={t('teacher.category')}>
                <Select value={form.category} onChange={(e) => setF('category', e.target.value)}>
                  <option value="">—</option>
                  {categories.map((c, i) => <option key={i} value={c.ar}>{c.ar}</option>)}
                </Select>
              </Field>
            )}
            {form.scope === 'courses' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('admin.discountScopeCourses')}</p>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border p-2">
                  {courses.map((c) => (
                    <label key={c._id} className="flex items-center gap-2 rounded p-1 hover:bg-muted/50 cursor-pointer">
                      <input type="checkbox" checked={form.courseIds.includes(c._id)} onChange={() => toggleCourse(c._id)} />
                      <span className="text-sm">{loc(c.title)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
                {t('admin.addDiscount')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Discounts list */}
      {discounts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t('admin.noData')}</Card>
      ) : (
        <div className="space-y-3">
          {discounts.map((d) => (
            <Card key={d._id} className={`p-4 flex items-center gap-4 ${!d.isActive ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold">{d.label}</p>
                  <Badge variant={d.isActive ? 'success' : 'muted'}>{d.isActive ? t('admin.discountActive') : t('common.inactive') || 'غير نشط'}</Badge>
                  <Badge variant="secondary">
                    {d.type === 'percent' ? `${d.value}%` : `${d.value} ₪`}
                  </Badge>
                  <Badge variant="accent">
                    {d.scope === 'all' ? t('admin.discountScopeAll') : d.scope === 'category' ? `${t('admin.discountScopeCategory')}: ${d.category}` : `${d.courseIds?.length} ${t('admin.courses')}`}
                  </Badge>
                </div>
                {d.expiresAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ينتهي: {new Date(d.expiresAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => toggle(d)}>
                  {d.isActive ? <ToggleRight className="size-5 text-success" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => del(d._id)} className="text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
