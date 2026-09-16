import { Router } from 'express';
import * as courseController from '../controllers/course.controller.js';
import * as contactController from '../controllers/contact.controller.js';
import { authenticate, requireRole } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { createCourseSchema, updateCourseSchema, idParamSchema } from '@/validators/course.validators';
import { listContactQuerySchema, updateContactSchema } from '@/validators/contact.validators';

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

/* Contact messages */
router.get('/contact', validate({ query: listContactQuerySchema }), contactController.adminListContact);
router.get('/contact/unread-count', contactController.adminUnreadCount);
router.patch(
  '/contact/:id',
  validate({ params: idParamSchema, body: updateContactSchema }),
  contactController.adminUpdateContact,
);

// Later modules mount: /students, /enrollments, /offers, /loyalty, /sessions,
// /services, /notifications, /cms, /reports

export default router;
