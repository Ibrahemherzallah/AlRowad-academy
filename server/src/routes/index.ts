import { Router } from 'express';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import contactRoutes from './contact.routes.js';
import dashboardRoutes from './dashboard.routes';
import teacherRoutes from './teacher.routes.js';
import enrollmentRoutes, { inviteRouter } from './enrollment.routes.js';
import videoRoutes from './video.routes';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/contact', contactRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/teacher', teacherRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/invites', inviteRouter);
router.use('/videos', videoRoutes);
router.use('/admin', adminRoutes);

// Phase 1 continued (mounted in later modules):
// router.use('/enrollments', enrollmentRoutes);
// router.use('/loyalty', loyaltyRoutes);

export default router;
