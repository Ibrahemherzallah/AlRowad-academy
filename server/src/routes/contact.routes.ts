import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { validate } from '@/middleware/validate';
import { createContactSchema } from '@/validators/contact.validators.js';
import { authLimiter } from '@/middleware/rateLimit';

const router = Router();

// Rate-limited to deter spam/abuse of the public form.
router.post('/', authLimiter, validate({ body: createContactSchema }), contactController.submitContact);

export default router;
