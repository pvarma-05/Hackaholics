import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer'; 
import prisma from './lib/prisma.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

dotenv.config();

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG or PNG images are allowed'));
    }
  },
});

const app = express();
const port = process.env.PORT || 4000;

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(upload.any());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use((req, res, next) => {
  req.prisma = prisma;
  req.clerkClient = clerkClient;
  next();
});

import userRoutes from './routes/user.js';
import companyRoutes from './routes/company.js';
import profileRoutes from './routes/profile.js';

app.use('/api', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.send('Hackaholics backend is running!');
});

// Error handling for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
