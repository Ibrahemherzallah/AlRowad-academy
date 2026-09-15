import { Router } from 'express';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/admin', adminRoutes);

// Phase 1 continued (mounted in later modules):
// router.use('/enrollments', enrollmentRoutes);
// router.use('/loyalty', loyaltyRoutes);

export default router;
