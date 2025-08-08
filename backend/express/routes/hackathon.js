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
  getHackathonParticipants,
  getHackathonSubmissions,
  reviewSubmission,
  getHackathonAnalytics
} from '../controllers/hackathonController.js';

const router = express.Router();

router.post('/', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), createHackathon);
router.get('/', getAllHackathons);
router.get('/:slug', ClerkExpressWithAuth(), getHackathonBySlug);
router.patch('/:id', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), updateHackathon);
router.delete('/:id', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), deleteHackathon);
router.post('/:id/register', ClerkExpressWithAuth(), registerForHackathon);
router.post('/:id/submit', ClerkExpressWithAuth(), submitProject);
router.get('/:id/participants', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), getHackathonParticipants);
router.get('/:hackathonId/submissions', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), getHackathonSubmissions);
router.patch('/:id/review', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), reviewSubmission);
router.get('/:hackathonId/analytics', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), getHackathonAnalytics);

export default router;
