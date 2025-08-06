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

router.get('/', getAllHackathons);
router.get('/:hackathonId/analytics', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), getHackathonAnalytics);
router.get('/:hackathonId/participants', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), getHackathonParticipants);
router.get('/:hackathonId/submissions', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), getHackathonSubmissions);
router.get('/:slug', ClerkExpressWithAuth(), getHackathonBySlug);
router.post('/', ClerkExpressWithAuth(), protect(['EXPERT']), createHackathon);
router.patch('/:id', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), updateHackathon);
router.delete('/:id', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), deleteHackathon);
router.post('/:id/register', ClerkExpressWithAuth(), protect(['STUDENT']), registerForHackathon);
router.post('/:id/submit', ClerkExpressWithAuth(), protect(['STUDENT']), submitProject);
router.patch('/submissions/:id/review', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), reviewSubmission);


export default router;
