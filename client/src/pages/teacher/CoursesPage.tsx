import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseGridSkeleton } from '@/components/courses/CourseCardSkeleton';
import { fetchCourses, fetchCategories, type CourseFilters } from '@/lib/courses.api';
import type { Course } from '@/lib/types';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 12;

export default function CoursesPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ ar: string; en: string; icon?: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const category = params.get('category') ?? '';
  const sort = (params.get('sort') as CourseFilters['sort']) ?? 'newest';
  const page = Number(params.get('page') ?? '1');
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const search = useDebounce(searchInput, 350);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Sync debounced search into the URL (resetting to page 1)
  useEffect(() => {
    const current = params.get('search') ?? '';
    if (search !== current) {
      const next = new URLSearchParams(params);
      if (search) next.set('search', search);
      else next.delete('search');
      next.set('page', '1');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Fetch courses on filter change
  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchCourses({ category, sort, search, page, limit: PAGE_SIZE })
      .then((res) => {
        setCourses(res.courses);
        setTotal(res.total);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [category, sort, search, page]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  };

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold md:text-4xl">{t('courses.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('common.tagline')}</p>
      </header>

      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('common.search')}
            className="ps-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="size-4" />
          </div>
          <Select
            value={category}
            onChange={(e) => update('category', e.target.value)}
            className="min-w-40"
            aria-label={t('courses.filterByCategory')}
          >
            <option value="">{t('courses.allCategories')}</option>
            {categories.map((c, i) => (
              <option key={i} value={c.ar}>
                {c.icon ? `${c.icon} ` : ''}{i18n.language === 'ar' ? c.ar : (c.en || c.ar)}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(e) => update('sort', e.target.value)}
            className="min-w-36"
            aria-label="Sort"
          >
            <option value="newest">{t('common.viewAll')}</option>
            <option value="price_asc">↑ {t('courses.filterByPrice')}</option>
            <option value="price_desc">↓ {t('courses.filterByPrice')}</option>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <CourseGridSkeleton count={6} />
      ) : error ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">{t('common.error')}</p>
          <Button variant="outline" className="mt-4" onClick={() => update('page', String(page))}>
            {t('common.retry')}
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">{t('courses.noResults')}</div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, i) => (
              <CourseCard key={course._id} course={course} index={i} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => update('page', String(page - 1))}
              >
                ‹
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update('page', String(i + 1))}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => update('page', String(page + 1))}
              >
                ›
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
