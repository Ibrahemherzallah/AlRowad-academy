export type Role = 'student' | 'admin';

export interface User {
  id: string;
  _id: string;
  name: string;
  phone: string;
  email: string;
  city?: string;
  role: Role;
  referralCode: string;
  loyaltyAccountId?: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface LocalizedString {
  ar: string;
  en: string;
}

export interface Lesson {
  _id: string;
  title: string;
  videoUrl: string;
  duration: number;
  isFreePreview: boolean;
  order: number;
}

export interface Section {
  _id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export type CourseStatus = 'draft' | 'published' | 'coming_soon' | 'archived';

export interface Course {
  _id: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  category: string;
  thumbnail?: string;
  instructorName?: string;
  instructorBio?: string;
  price: number;
  discountedPrice?: number | null;
  effectivePrice: number;
  status: CourseStatus;
  startDate?: string | null;
  endDate?: string | null;
  maxStudents?: number | null;
  curriculum: Section[];
  faqs: { question: string; answer: string }[];
  createdAt: string;
}

export interface LoyaltySummary {
  pointsBalance: number;
  threshold: number;
  lifetimePointsEarned: number;
  vouchers: LoyaltyVoucher[];
}

export interface LoyaltyVoucher {
  _id: string;
  code: string;
  discountPercent: number;
  status: 'active' | 'used' | 'expired';
  expiresAt?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}
