import { api, unwrap } from '@/lib/api';
import type { ApiEnvelope, Course } from '@/lib/types';

export interface CourseFilters {
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export interface CoursesResult {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
}

export interface CourseDetail extends Course {
  enrolledCount: number;
  isFull: boolean;
}

export async function fetchCourses(filters: CourseFilters = {}): Promise<CoursesResult> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  );
  const res = await api.get<ApiEnvelope<Course[]>>('/courses', { params });
  return {
    courses: res.data.data,
    total: res.data.meta?.total ?? res.data.data.length,
    page: res.data.meta?.page ?? 1,
    limit: res.data.meta?.limit ?? 12,
  };
}

export async function fetchCategories(): Promise<string[]> {
  const { data } = await api.get<ApiEnvelope<string[]>>('/courses/categories');
  return unwrap(data);
}

export async function fetchCourseBySlug(slug: string): Promise<CourseDetail> {
  const { data } = await api.get<ApiEnvelope<CourseDetail>>(`/courses/${slug}`);
  return unwrap(data);
}
