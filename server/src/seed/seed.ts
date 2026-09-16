import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User, hashPassword } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Offer } from '../models/Offer.js';
import { getSettings } from '../models/Settings.js';
import { ensureLoyaltyAccount, awardEnrollmentPoints } from '../services/loyalty.service.js';
import { logger } from '../utils/logger.js';
import { SEED_COURSES, SEED_STUDENTS, SEED_OFFERS } from './seedData';

/** Pass --fresh to wipe existing collections before seeding. */
const FRESH = process.argv.includes('--fresh');

async function seed() {
  await connectDB();
  logger.info('🌱 Seeding database...');

  if (FRESH) {
    logger.warn('--fresh: clearing collections');
    await Promise.all([
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Offer.deleteMany({}),
      User.deleteMany({ role: 'student' }),
    ]);
  }

  // Settings singleton
  await getSettings();

  /* ---------- Admin ---------- */
  const adminPhone = '+970590000000';
  let admin = await User.findOne({ phone: adminPhone });
  if (!admin) {
    admin = await User.create({
      name: 'مدير الأكاديمية',
      phone: '+970590000000',
      passwordHash: await hashPassword('Admin@12345'),
      role: 'admin',
      isVerified: true,
      city: 'الخليل',
    });
    await ensureLoyaltyAccount(admin._id.toString());
    logger.info(`👤 Admin created: ${adminPhone} / Admin@12345`);
  } else {
    logger.info('👤 Admin already exists');
  }

  /* ---------- Courses ---------- */
  const courseBySlug: Record<string, any> = {};
  for (const c of SEED_COURSES) {
    let course = await Course.findOne({ slug: c.slug });
    if (!course) {
      course = await Course.create({
        slug: c.slug,
        title: c.title,
        description: c.description,
        category: c.category,
        instructorName: c.instructorName,
        instructorBio: c.instructorBio,
        price: c.price,
        discountedPrice: c.discountedPrice ?? null,
        installmentOptions: c.installmentOptions ?? [],
        status: c.status,
        accessBufferWeeks: c.accessBufferWeeks ?? 2,
        maxStudents: c.maxStudents ?? null,
        waitlistEnabled: c.waitlistEnabled ?? false,
        curriculum: c.curriculum.map((s, si) => ({
          title: s.title,
          order: si,
          lessons: s.lessons.map((l, li) => ({
            title: l.title,
            duration: l.duration,
            isFreePreview: l.isFreePreview ?? false,
            order: li,
            videoUrl: l.isFreePreview ? `https://cdn.rawad.academy/preview/${c.slug}-${si}-${li}.mp4` : `https://cdn.rawad.academy/private/${c.slug}-${si}-${li}.mp4`,
          })),
        })),
        faqs: c.faqs,
      });
      logger.info(`📚 Course seeded: ${c.slug}`);
    }
    courseBySlug[c.slug] = course;
  }

  /* ---------- Students ---------- */
  const students: any[] = [];
  for (const s of SEED_STUDENTS) {
    let student = await User.findOne({ phone: s.phone });
    if (!student) {
      student = await User.create({
        name: s.name,
        phone: s.phone,
        city: s.city,
        passwordHash: await hashPassword('Student@123'),
        role: 'student',
        isVerified: true,
      });
      await ensureLoyaltyAccount(student._id.toString());
      logger.info(`🧑‍🎓 Student seeded: ${s.phone} / Student@123`);
    }
    students.push(student);
  }

  /* ---------- Enrollments + loyalty ---------- */
  // Give the first three students a couple of active enrollments each so the
  // dashboard, loyalty points, and admin lists have data to render.
  const enrollPlan: { student: number; slugs: string[] }[] = [
    { student: 0, slugs: ['digital-marketing', 'entrepreneurship'] },
    { student: 1, slugs: ['graphic-design'] },
    { student: 2, slugs: ['frontend-development', 'programming-fundamentals', 'claude-ai-tools'] },
  ];

  for (const plan of enrollPlan) {
    const student = students[plan.student];
    if (!student) continue;
    for (const slug of plan.slugs) {
      const course = courseBySlug[slug];
      if (!course) continue;
      const already = await Enrollment.findOne({ studentId: student._id, courseId: course._id });
      if (already) continue;

      const price = course.discountedPrice ?? course.price;
      const now = new Date();
      const end = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7 * (4 + course.accessBufferWeeks));
      await Enrollment.create({
        studentId: student._id,
        courseId: course._id,
        status: 'active',
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        amountPaid: price,
        totalAmount: price,
        accessStartDate: now,
        accessEndDate: end,
        loyaltyAwarded: true,
      });
      // Award loyalty points (may cross threshold → issues a voucher).
      await awardEnrollmentPoints(student._id.toString(), course._id.toString(), course.title.ar, course.loyaltyPointsOverride);
      logger.info(`✅ Enrolled ${student.name} → ${slug}`);
    }
  }

  /* ---------- Offers ---------- */
  for (const o of SEED_OFFERS) {
    const exists = o.code ? await Offer.findOne({ code: o.code }) : await Offer.findOne({ name: o.name });
    if (!exists) {
      await Offer.create(o);
      logger.info(`🎟️  Offer seeded: ${o.name}`);
    }
  }

  logger.info('✅ Seed complete');
  logger.info('   Admin:   +970590000000 / Admin@12345');
  logger.info('   Student: +970591000001 / Student@123');

  await disconnectDB();
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
