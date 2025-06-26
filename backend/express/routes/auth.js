import express from 'express';
import requireAuth from '../middlewares/requireAuth.js';
import prisma from '../prisma/client.js';

const router = express.Router();

router.post('/signup', requireAuth, async (req, res) => {
  const { sub: clerkId, email, firstName, lastName, imageUrl, fullName } = req.auth;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (existingUser) {
      return res.json({ message: 'User Already Exists', user: existingUser });
    }

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name: fullName || `${firstName} ${lastName}`,
        firstName,
        lastName,
        profileImageUrl: imageUrl
      }
    });

    res.status(201).json({ message: 'User created', user: newUser });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
