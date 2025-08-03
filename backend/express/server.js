import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import prisma from './lib/prisma.js';
import { clerkClient, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

import userRoutes from './routes/user.js';
import companyRoutes from './routes/company.js';
import profileRoutes from './routes/profile.js';
import hackathonRoutes from './routes/hackathon.js';
import imagekitRoutes from './routes/imagekit.js';

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG or PNG images are allowed'));
    }
  },
});
export { upload };

const app = express();
const port = process.env.PORT || 4000;

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(ClerkExpressWithAuth());

app.use((req, res, next) => {
  req.prisma = prisma;
  req.clerkClient = clerkClient;
  next();
});

app.use('/api', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/imagekit', imagekitRoutes);

app.get('/', (req, res) => {
  res.send('Hackaholics backend is running!');
});

app.use((err, req, res, next) => {
  if (err.clerkError) {
    console.error('Clerk Authentication Error (likely from protect middleware):', err);
    return res.status(401).json({ error: 'Authentication failed: ' + err.longMessage || err.message });
  }
  if (err instanceof multer.MulterError) {
    console.error('Multer Error:', err);
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error('Unhandled Server Error:', err);
    return res.status(500).json({ error: err.message || 'An unknown server error occurred' });
  }
  next();
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
