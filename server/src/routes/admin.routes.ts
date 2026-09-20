import { Router } from 'express';
import * as courseController from '../controllers/course.controller.js';
import * as contactController from '../controllers/contact.controller.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as adminUsers from '../controllers/adminUsers.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCourseSchema,
  updateCourseSchema,
  idParamSchema,
} from '../validators/course.validators.js';
import {
} from '../validators/contact.validators.js';
import {
  createTeacherSchema,
  updateTeacherSchema,
  connectStudentSchema,
  addPaymentSchema,
  adminCreateInviteSchema,
} from '../validators/adminUsers.validators.js';

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
router.get('/admins', adminUsers.listAdmins);
router.post('/admins', validate({ body: createTeacherSchema }), adminUsers.createAdmin);
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
router.get('/enrollments/:id/payments', validate({ params: idParamSchema }), adminUsers.enrollmentPayments);

/* Admin invite links */
router.post('/invites', validate({ body: adminCreateInviteSchema }), adminUsers.adminCreateInvite);

/* Contact messages */
router.get('/contact', adminUsers.listMessages);
router.get('/contact/unread-count', contactController.adminUnreadCount);
router.patch('/contact/:id', validate({ params: idParamSchema }), adminUsers.updateMessage);

/* Categories */
router.get('/categories', adminUsers.listCategories);
router.post('/categories', adminUsers.addCategory);
router.delete('/categories/:index', adminUsers.deleteCategory);

/* Discounts */
router.get('/discounts', adminUsers.listDiscounts);
router.post('/discounts', adminUsers.createDiscount);
router.patch('/discounts/:id', validate({ params: idParamSchema }), adminUsers.updateDiscount);
router.delete('/discounts/:id', validate({ params: idParamSchema }), adminUsers.deleteDiscount);

/* Financial report */
router.get('/financial', adminUsers.financialReport);

/* All-courses timetable */
router.get('/timetable', adminUsers.timetable);

export default router;
