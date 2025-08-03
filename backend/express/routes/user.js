import express from 'express';
import { checkUsername, getMyHostedHackathons } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

const router = express.Router();

router.post('/check-username', checkUsername);
router.get('/me/hackathons', ClerkExpressWithAuth(), protect(['EXPERT', 'ADMIN']), getMyHostedHackathons);

export default router;
