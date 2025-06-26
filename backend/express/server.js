import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from './generated/prisma/index.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Check username availability
app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;

  // Guard clause: ensure username is not blank/empty/invalid
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    const available = !existingUser;
    res.json({ available });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

// Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: { approved: true },
      select: { id: true, name: true },
    });
    res.json(companies);
  } catch (error) {
    console.error('Fetch companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Create company
app.post('/api/companies', async (req, res) => {
  const { name, websiteUrl, description, phoneNumber, emailDomain, createdById } = req.body;
  try {
    // Validate createdById exists in User table
    const user = await prisma.user.findUnique({
      where: { id: createdById },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid createdById: User does not exist' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        websiteUrl,
        description,
        phoneNumber,
        emailDomain,
        createdById,
        approved: true, // MVP: auto-approve
      },
    });
    res.json(company);
  } catch (error) {
    console.error('Create company error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Company name already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid createdById: User does not exist' });
    }
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Create student profile
app.post('/api/profile/student', async (req, res) => {
  const { clerkId, role, name, username, email, profileImageUrl, ...studentProfileData } = req.body;
  try {
    // Update Clerk username
    await clerkClient.users.updateUser(clerkId, { username });

    const user = await prisma.user.create({
      data: {
        clerkId,
        username,
        name,
        email,
        profileImageUrl,
        role,
        studentProfile: {
          create: {
            ...studentProfileData,
          },
        },
      },
    });
    res.json(user);
  } catch (error) {
    console.error('Create student profile error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Create expert profile
app.post('/api/profile/expert', async (req, res) => {
  const { clerkId, role, companyId, isApprovedInCompany, name, username, email, profileImageUrl, specialty, skills, bio, interests } = req.body;
  try {
    // Update Clerk username
    await clerkClient.users.updateUser(clerkId, { username });

    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        username,
        name,
        email,
        profileImageUrl,
        role,
        expertProfile: {
          upsert: {
            create: {
              specialty,
              skills,
              bio,
              interests,
              companyId,
              isApprovedInCompany,
            },
            update: {
              specialty,
              skills,
              bio,
              interests,
              companyId,
              isApprovedInCompany,
            },
          },
        },
      },
      create: {
        clerkId,
        username,
        name,
        email,
        profileImageUrl,
        role,
        expertProfile: {
          create: {
            specialty,
            skills,
            bio,
            interests,
            companyId,
            isApprovedInCompany,
          },
        },
      },
    });

    if (companyId && !isApprovedInCompany) {
      await prisma.companyJoinRequest.create({
        data: {
          expertProfileId: user.expertProfile.id,
          companyId,
          status: 'PENDING',
        },
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Create expert profile error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    if (error.meta?.code === 'user_not_found') {
      return res.status(404).json({ error: 'Clerk user not found' });
    }
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Update expert profile (for companyId)
app.patch('/api/profile/expert', async (req, res) => {
  const { clerkId, companyId, isApprovedInCompany } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { expertProfile: true },
    });
    if (!user || !user.expertProfile) {
      return res.status(400).json({ error: 'Expert profile not found' });
    }

    const updatedProfile = await prisma.expertProfile.update({
      where: { id: user.expertProfile.id },
      data: {
        companyId,
        isApprovedInCompany,
      },
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update expert profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/', (req, res) => {
  res.send('Hackaholics backend is running!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
