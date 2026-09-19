import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All dashboard routes require an authenticated user.
router.use(authenticate);

router.get('/student', dashboardController.studentOverview);
router.get('/loyalty', dashboardController.studentLoyalty);
router.get('/courses/:courseId', dashboardController.studentCourseDetail);

export default router;
