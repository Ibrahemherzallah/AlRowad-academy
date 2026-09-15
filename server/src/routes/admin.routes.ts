import { Router } from 'express';
import * as courseController from '../controllers/course.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCourseSchema,
  updateCourseSchema,
  idParamSchema,
} from '../validators/course.validators.js';

const router = Router();

// Every admin route requires an authenticated admin.
router.use(authenticate, requireRole('admin'));

/* Courses */
router.get('/courses', courseController.adminListCourses);
router.post('/courses', validate({ body: createCourseSchema }), courseController.createCourse);
router.get('/courses/:id', validate({ params: idParamSchema }), courseController.adminGetCourse);
router.patch(
  '/courses/:id',
  validate({ params: idParamSchema, body: updateCourseSchema }),
  courseController.updateCourse,
);
router.delete('/courses/:id', validate({ params: idParamSchema }), courseController.deleteCourse);

// Later modules mount: /students, /enrollments, /offers, /loyalty, /sessions,
// /services, /notifications, /cms, /reports

export default router;
