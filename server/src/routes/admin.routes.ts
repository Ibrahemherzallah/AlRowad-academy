import { Router } from 'express';
import * as courseController from '../controllers/course.controller.js';
import * as contactController from '../controllers/contact.controller.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as adminUsers from '../controllers/adminUsers.controller.js';
import { authenticate, requireRole } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  createCourseSchema,
  updateCourseSchema,
  idParamSchema,
} from '@/validators/course.validators.js';
import {
  listContactQuerySchema,
  updateContactSchema,
} from '@/validators/contact.validators.js';
import {
  createTeacherSchema,
  updateTeacherSchema,
  connectStudentSchema,
  addPaymentSchema,
} from '@/validators/adminUsers.validators.js';

const router = Router();

// Every admin route requires an authenticated admin.
router.use(authenticate, requireRole('admin'));

/* Dashboard overview */
router.get('/dashboard', dashboardController.adminOverview);

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
router.get('/courses/:id/stats', validate({ params: idParamSchema }), adminUsers.courseStats);

/* Teachers */
router.get('/teachers', adminUsers.listTeachers);
router.post('/teachers', validate({ body: createTeacherSchema }), adminUsers.createTeacher);
router.patch(
  '/teachers/:id',
  validate({ params: idParamSchema, body: updateTeacherSchema }),
  adminUsers.updateTeacher,
);
router.post('/teachers/:id/settle', validate({ params: idParamSchema }), adminUsers.settleCommissions);

/* Students */
router.get('/students', adminUsers.listStudents);

/* Enrollments & payments */
router.get('/enrollments', adminUsers.listEnrollments);
router.get('/enrollments/price-preview', adminUsers.pricePreview);
router.post('/enrollments/connect', validate({ body: connectStudentSchema }), adminUsers.connectStudent);
router.post(
  '/enrollments/:id/payment',
  validate({ params: idParamSchema, body: addPaymentSchema }),
  adminUsers.addPayment,
);

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
