import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createHackathon,
  getAllHackathons,
  getHackathonBySlug,
  updateHackathon,
  deleteHackathon,
  registerForHackathon,
  submitProject,
} from '../controllers/hackathonController.js';

const router = express.Router();

router.get('/', getAllHackathons);
router.get('/:slug', getHackathonBySlug);

router.post('/', protect(['EXPERT']), createHackathon);
router.patch('/:id', protect(['EXPERT', 'ADMIN']), updateHackathon);
router.delete('/:id', protect(['EXPERT', 'ADMIN']), deleteHackathon);

router.post('/:id/register', protect(['STUDENT']), registerForHackathon);
router.post('/:id/submit', protect(['STUDENT']), submitProject);

export default router;
