import express from 'express';
import {
  createStudentProfile,
  createExpertProfile,
  updateExpertCompany,
  getProfileByUsername,
  updateProfile,
  updateStudentProfile,
  updateExpertProfile,
  updateAccount,
  updateProfileImage,
} from '../controllers/profileController.js';

const router = express.Router();

router.post('/student', createStudentProfile);
router.post('/expert', createExpertProfile);
router.patch('/expert', updateExpertCompany);
router.get('/:username', getProfileByUsername);
router.patch('/', updateProfile);
router.patch('/student', updateStudentProfile);
router.patch('/expert', updateExpertProfile);
router.patch('/account', updateAccount);
router.patch('/image', updateProfileImage);

export default router;
