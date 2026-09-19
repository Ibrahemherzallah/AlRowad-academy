import { Router } from 'express';
import * as enrollmentController from '../controllers/enrollment.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  reserveSchema,
  createInviteSchema,
  codeParamSchema,
} from '../validators/enrollment.validators';

/* Public invite resolution (no auth) */
export const inviteRouter = Router();
inviteRouter.get('/:code', validate({ params: codeParamSchema }), enrollmentController.resolveInvite);

/* Student enrollment actions (auth + student role) */
const router = Router();
router.use(authenticate, requireRole('student'));

router.post('/reserve', validate({ body: reserveSchema }), enrollmentController.reserveSeat);
router.get('/my-invites', enrollmentController.myInvites);
router.post('/my-invites', validate({ body: createInviteSchema }), enrollmentController.createMyInvite);

export default router;
