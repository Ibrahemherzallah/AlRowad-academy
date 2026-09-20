import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { adminApi } from '@/lib/admin.api';

interface Category { ar: string; en: string; icon?: string; }

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ar: '', en: '', icon: '' });

  const load = () => {
    adminApi.listCategories()
      .then((c) => setCats(c as Category[]))
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ar.trim()) { toast.error(t('validation.required')); return; }
    setSaving(true);
    try {
      await adminApi.addCategory({ ar: form.ar, en: form.en || form.ar, icon: form.icon });
      toast.success(t('common.save'));
      setForm({ ar: '', en: '', icon: '' });
      load();
    } catch { toast.error(t('common.error')); }
    finally { setSaving(false); }
  };

  const del = async (i: number) => {
    if (!confirm(t('admin.deleteCategory'))) return;
    try {
      await adminApi.deleteCategory(i);
      load();
    } catch { toast.error(t('common.error')); }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-extrabold">{t('admin.categories')}</h2>

      {/* Add form */}
      <Card className="p-6">
        <form onSubmit={add} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="car" label={t('admin.categoryNameAr')}>
              <Input value={form.ar} onChange={(e) => setForm((f) => ({ ...f, ar: e.target.value }))} required />
            </Field>
            <Field id="cen" label={t('admin.categoryNameEn')}>
              <Input value={form.en} onChange={(e) => setForm((f) => ({ ...f, en: e.target.value }))} dir="ltr" />
            </Field>
          </div>
          <Field id="cicon" label={`${t('admin.categoryIcon')} (emoji أو نص)`}>
            <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="💻" />
          </Field>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t('admin.addCategory')}
          </Button>
        </form>
      </Card>

      {/* List */}
      {cats.length === 0 ? (
        <p className="text-muted-foreground">{t('admin.noData')}</p>
      ) : (
        <div className="space-y-2">
          {cats.map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                {c.icon && <span className="text-2xl">{c.icon}</span>}
                <div>
                  <p className="font-bold">{c.ar}</p>
                  {c.en && c.en !== c.ar && <p className="text-sm text-muted-foreground" dir="ltr">{c.en}</p>}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(i)} className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
