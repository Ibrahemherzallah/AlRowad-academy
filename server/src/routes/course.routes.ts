import { Router } from 'express';
import * as courseController from '../controllers/course.controller.js';
import { validate } from '@/middleware/validate';
import {
  listCoursesQuerySchema,
  slugParamSchema,
} from '@/validators/course.validators.js';

const router = Router();

router.get('/', validate({ query: listCoursesQuerySchema }), courseController.listCourses);
router.get('/categories', courseController.listCategories);
router.get('/:slug', validate({ params: slugParamSchema }), courseController.getCourseBySlug);

export default router;
