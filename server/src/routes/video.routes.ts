import { Router } from 'express';
import * as videoController from '../controllers/video.controller.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Optional auth: free-preview lessons play for anyone; paid lessons require a
// valid token, which the controller enforces per-lesson.
router.get('/:lessonId/play', optionalAuthenticate, videoController.getPlayback);

export default router;
