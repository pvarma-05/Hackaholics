import express from 'express';
import { checkUsername } from '../controllers/userController.js';

const router = express.Router();
router.post('/check-username', checkUsername);

export default router;
