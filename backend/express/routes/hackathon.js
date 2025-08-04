import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import {
  createHackathon,
  getAllHackathons,
  getHackathonBySlug,
  updateHackathon,
  deleteHackathon,
  registerForHackathon,
  submitProject,
  getHackathonAnalytics
} from '../controllers/hackathonController.js';

const router = express.Router();

router.get('/', getAllHackathons);
router.get('/:slug', ClerkExpressWithAuth(), getHackathonBySlug);
router.post('/', ClerkExpressWithAuth(), protect(['EXPERT']), createHackathon);
router.patch('/:id', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), updateHackathon);
router.delete('/:id', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), deleteHackathon);
router.post('/:id/register', ClerkExpressWithAuth(), protect(['STUDENT']), registerForHackathon);
router.post('/:id/submit', ClerkExpressWithAuth(), protect(['STUDENT']), submitProject);
router.get('/:hackathonId/analytics', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), getHackathonAnalytics);


export default router;
