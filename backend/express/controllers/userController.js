// import prisma from '../lib/prisma.js';

const getInternalUserIdByClerkId = async (prismaInstance, clerkId) => {
    if (!clerkId) return null;
    const user = await prismaInstance.user.findUnique({
        where: { clerkId: clerkId },
        select: { id: true }
    });
    return user ? user.id : null;
};

export const checkUsername = async (req, res) => {
  const { username } = req.body;
  const prisma = req.prisma;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    res.json({ available: !existingUser });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
};

export const getMyHostedHackathons = async (req, res) => {
    const prisma = req.prisma;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const internalUserId = await getInternalUserIdByClerkId(prisma, clerkId);
        if (!internalUserId) {
            return res.status(404).json({ error: 'User profile not found in database.' });
        }

        const hostedHackathons = await prisma.hackathon.findMany({
            where: {
                createdByUserId: internalUserId
            },
            select: {
                id: true,
                title: true,
                slug: true,
                startDate: true,
                endDate: true,
                registrationEndDate: true,
                submissionEndDate: true,
                status: true,
                company: { select: { name: true } },

                _count: {
                    select: {
                        registrations: true,
                        submissions: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const now = new Date();
        const hackathonsWithDisplayStatus = hostedHackathons.map(h => {
            let displayStatus = h.status;
            if (now < h.registrationEndDate) { displayStatus = 'REGISTRATION_OPEN'; }
            else if (now >= h.registrationEndDate && now < h.submissionEndDate) { displayStatus = 'REGISTRATION_CLOSED'; }
            else if (now >= h.submissionEndDate && now < h.endDate) { displayStatus = 'JUDGING'; }
            else if (now >= h.endDate && h.status !== 'COMPLETED' && h.status !== 'ARCHIVED') { displayStatus = 'COMPLETED'; }
            return { ...h, displayStatus: displayStatus.replaceAll('_', ' ') };
        });


        res.json(hackathonsWithDisplayStatus);
    } catch (error) {
        console.error('Error fetching hosted hackathons:', error);
        res.status(500).json({ error: 'Failed to fetch hosted hackathons.' });
    }
};
