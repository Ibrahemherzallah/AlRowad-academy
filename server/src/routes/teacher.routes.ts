import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  teacherCreateCourseSchema,
  teacherUpdateCourseSchema,
  scheduleSchema,
  updateScheduleSchema,
  createInviteSchema,
  updateTeacherProfileSchema,
} from '../validators/teacher.validators';
import { idParamSchema } from '../validators/course.validators.js';

const router = Router();

router.use(authenticate, requireRole('teacher'));

router.get('/overview', teacherController.overview);
router.patch('/profile', validate({ body: updateTeacherProfileSchema }), teacherController.updateProfile);

/* Courses */
router.get('/courses', teacherController.myCourses);
router.post('/courses', validate({ body: teacherCreateCourseSchema }), teacherController.createCourse);
router.get('/courses/:id', validate({ params: idParamSchema }), teacherController.getCourse);
router.patch(
  '/courses/:id',
  validate({ params: idParamSchema, body: teacherUpdateCourseSchema }),
  teacherController.updateCourse,
);
router.patch('/courses/:id/lessons', validate({ params: idParamSchema }), teacherController.updateLessons);

/* Schedules */
router.get('/schedule', teacherController.mySchedule);
router.post('/schedules', validate({ body: scheduleSchema }), teacherController.createSchedule);
router.patch(
  '/schedules/:id',
  validate({ params: idParamSchema, body: updateScheduleSchema }),
  teacherController.updateSchedule,
);
router.delete('/schedules/:id', validate({ params: idParamSchema }), teacherController.deleteSchedule);

/* Invites */
router.get('/invites', teacherController.myInvites);
router.post('/invites', validate({ body: createInviteSchema }), teacherController.createInvite);

/* Earnings & students */
router.get('/earnings', teacherController.myEarnings);
router.get('/students', teacherController.myStudents);

export default router;
