import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadImage, initVideoUpload } from '../controllers/upload.controller.js';

const router = Router();

router.post('/image', authenticate, requireRole('teacher', 'admin'), uploadImage);
router.post('/video-init', authenticate, requireRole('teacher', 'admin'), initVideoUpload);

export default router;
