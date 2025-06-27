import express from 'express';
import { getAllCompanies, createCompany } from '../controllers/companyController.js';

const router = express.Router();
router.get('/', getAllCompanies);
router.post('/', createCompany);

export default router;
