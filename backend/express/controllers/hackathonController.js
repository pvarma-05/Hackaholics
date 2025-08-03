
import slugify from 'slugify';


const getInternalUserIdByClerkId = async (prisma, clerkId) => {
    if (!clerkId) return null;
    const user = await prisma.user.findUnique({
        where: { clerkId: clerkId },
        select: { id: true }
    });
    return user ? user.id : null;
};


export const createHackathon = async (req, res) => {
  const prisma = req.prisma;
  const {
    title, description, rules, bannerImageUrl, startDate, endDate,
    registrationEndDate, submissionEndDate, reviewType, companyId
  } = req.body;
  const createdByUserId = req.user.id;

  if (!title || !description || !startDate || !endDate || !registrationEndDate || !submissionEndDate || !reviewType) {
    return res.status(400).json({ error: 'Missing required hackathon fields.' });
  }

  const baseSlug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  let hackathonSlug = baseSlug;
  let counter = 1;
  while (await prisma.hackathon.findUnique({ where: { slug: hackathonSlug } })) {
    hackathonSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  try {
    const newHackathon = await prisma.hackathon.create({
      data: {
        title, slug: hackathonSlug, description, rules, bannerImageUrl,
        startDate: new Date(startDate), endDate: new Date(endDate),
        registrationEndDate: new Date(registrationEndDate), submissionEndDate: new Date(submissionEndDate),
        reviewType, createdByUserId, companyId: companyId || null, status: 'UPCOMING',
      },
    });
    res.status(201).json(newHackathon);
  } catch (error) {
    console.error('Error creating hackathon:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('title')) {
      return res.status(400).json({ error: 'Hackathon with this title already exists.' });
    }
    res.status(500).json({ error: 'Failed to create hackathon.' });
  }
};

export const getAllHackathons = async (req, res) => {
  const prisma = req.prisma;

  try {
    const hackathons = await prisma.hackathon.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, description: true, bannerImageUrl: true,
        startDate: true, endDate: true, registrationEndDate: true, submissionEndDate: true,
        status: true, reviewType: true,
        createdBy: { select: { name: true, username: true } },
        company: { select: { name: true } }
      }
    });

    const now = new Date();
    const hackathonsWithDisplayStatus = hackathons.map(h => {
        let displayStatus = h.status;
        if (now < h.registrationEndDate) { displayStatus = 'REGISTRATION_OPEN'; }
        else if (now >= h.registrationEndDate && now < h.submissionEndDate) { displayStatus = 'REGISTRATION_CLOSED'; }
        else if (now >= h.submissionEndDate && now < h.endDate) { displayStatus = 'JUDGING'; }
        else if (now >= h.endDate && h.status !== 'COMPLETED' && h.status !== 'ARCHIVED') { displayStatus = 'COMPLETED'; }
        return { ...h, displayStatus: displayStatus.replaceAll('_', ' ') };
    });

    res.json(hackathonsWithDisplayStatus);
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    res.status(500).json({ error: 'Failed to fetch hackathons.' });
  }
};

export const getHackathonBySlug = async (req, res) => {
  const prisma = req.prisma;
  const { slug } = req.params;
  const clerkUserId = req.auth?.userId;


  const internalUserId = await getInternalUserIdByClerkId(prisma, clerkUserId);

  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { slug },
      include: {
        createdBy: { select: { id: true, name: true, username: true, profileImageUrl: true } },
        company: { select: { id: true, name: true, websiteUrl: true } },
        registrations: internalUserId ? {
          where: { userId: internalUserId },
          include: { submission: true }
        } : false,
      },
    });

    if (!hackathon) { return res.status(404).json({ error: 'Hackathon not found.' }); }

    const isRegistered = hackathon.registrations && hackathon.registrations.length > 0;
    const currentUserSubmission = isRegistered ? hackathon.registrations[0]?.submission : null;
    const hasSubmitted = !!currentUserSubmission;


    console.log(`Backend for slug ${slug}: ClerkUserId=${clerkUserId}, InternalUserId=${internalUserId}, isRegistered=${isRegistered}, hasSubmitted=${hasSubmitted}`);


    const now = new Date();
    let displayStatus = hackathon.status;
    if (now < hackathon.registrationEndDate) { displayStatus = 'REGISTRATION_OPEN'; }
    else if (now >= hackathon.registrationEndDate && now < hackathon.submissionEndDate) { displayStatus = 'REGISTRATION_CLOSED'; }
    else if (now >= hackathon.submissionEndDate && now < hackathon.endDate) { displayStatus = 'JUDGING'; }
    else if (now >= hackathon.endDate && hackathon.status !== 'COMPLETED' && hackathon.status !== 'ARCHIVED') { displayStatus = 'COMPLETED'; }

    const hackathonResponse = {
        ...hackathon,
        isRegistered,
        hasSubmitted,
        currentUserSubmission,
        displayStatus: displayStatus.replaceAll('_', ' '),
        registrations: undefined
    };

    res.json(hackathonResponse);
  } catch (error) {
    console.error('Error fetching hackathon by slug:', error);
    res.status(500).json({ error: 'Failed to fetch hackathon details.' });
  }
};


export const updateHackathon = async (req, res) => {
  const prisma = req.prisma;
  const { id } = req.params;
  const { id: userId, role } = req.user;
  const updateData = req.body;

  try {
    const existingHackathon = await prisma.hackathon.findUnique({ where: { id } });
    if (!existingHackathon) return res.status(404).json({ error: 'Hackathon not found.' });

    if (existingHackathon.createdByUserId !== userId && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized: You are not the creator or an Admin for this hackathon.' });
    }

    if (updateData.title && updateData.title !== existingHackathon.title) {
        const newBaseSlug = slugify(updateData.title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
        let newSlug = newBaseSlug;
        let counter = 1;
        while (await prisma.hackathon.findUnique({ where: { slug: newSlug } })) { newSlug = `${newBaseSlug}-${counter}`; counter++; }
        updateData.slug = newSlug;
    }
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.registrationEndDate) updateData.registrationEndDate = new Date(updateData.registrationEndDate);
    if (updateData.submissionEndDate) updateData.submissionEndDate = new Date(updateData.submissionEndDate);

    const updatedHackathon = await prisma.hackathon.update({ where: { id }, data: updateData });
    res.json(updatedHackathon);
  } catch (error) {
    console.error('Error updating hackathon:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) { return res.status(400).json({ error: 'A hackathon with a similar title already exists.' }); }
    res.status(500).json({ error: 'Failed to update hackathon.' });
  }
};

export const deleteHackathon = async (req, res) => {
  const prisma = req.prisma;
  const { id } = req.params;
  const { id: userId, role } = req.user;

  try {
    const existingHackathon = await prisma.hackathon.findUnique({ where: { id } });
    if (!existingHackathon) return res.status(404).json({ error: 'Hackathon not found.' });

    if (existingHackathon.createdByUserId !== userId && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized: You are not the creator or an Admin for this hackathon.' });
    }

    await prisma.hackathon.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting hackathon:', error);
    res.status(500).json({ error: 'Failed to delete hackathon.' });
  }
};

export const registerForHackathon = async (req, res) => {
  const prisma = req.prisma;
  const { id: hackathonId } = req.params;
  const clerkUserId = req.auth?.userId;


  const internalUserId = await getInternalUserIdByClerkId(prisma, clerkUserId);
  if (!internalUserId) {
      return res.status(400).json({ error: 'Invalid user for registration.' });
  }

  try {
    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found.' });

    const now = new Date();
    if (now > hackathon.registrationEndDate) { return res.status(400).json({ error: 'Registration for this hackathon has closed.' }); }

    const existingRegistration = await prisma.hackathonRegistration.findUnique({
      where: {
        hackathonId_userId: { hackathonId, userId: internalUserId },
      },
    });

    if (existingRegistration) { return res.status(400).json({ error: 'Already registered for this hackathon.' }); }

    const registration = await prisma.hackathonRegistration.create({
      data: {
        hackathonId,
        userId: internalUserId,
      },
    });
    res.status(201).json(registration);
  } catch (error) {
    console.error('Error registering for hackathon:', error);
    res.status(500).json({ error: 'Failed to register for hackathon.' });
  }
};

export const submitProject = async (req, res) => {
    const prisma = req.prisma;
    const { id: hackathonId } = req.params;
    const { submissionUrl, submissionText } = req.body;
    const clerkUserId = req.auth?.userId;


    const internalUserId = await getInternalUserIdByClerkId(prisma, clerkUserId);
    if (!internalUserId) {
        return res.status(400).json({ error: 'Invalid user for submission.' });
    }

    if (!submissionUrl && !submissionText) { return res.status(400).json({ error: 'Either submission URL or submission text is required.' }); }

    try {
        const registration = await prisma.hackathonRegistration.findUnique({
            where: { hackathonId_userId: { hackathonId, userId: internalUserId } },
            include: { hackathon: true }
        });

        if (!registration) { return res.status(404).json({ error: 'You are not registered for this hackathon.' }); }
        if (!registration.hackathon) { return res.status(500).json({ error: 'Associated hackathon data not found.' }); }

        const now = new Date();
        if (now > registration.hackathon.submissionEndDate) { return res.status(400).json({ error: 'Submission deadline for this hackathon has passed.' }); }

        const existingSubmission = await prisma.projectSubmission.findUnique({ where: { registrationId: registration.id } });

        let savedSubmission;
        if (existingSubmission) {
            savedSubmission = await prisma.projectSubmission.update({
                where: { id: existingSubmission.id },
                data: {
                    submissionUrl: submissionUrl || null, submissionText: submissionText || null,
                    score: null, feedback: null, status: 'PENDING_REVIEW'
                }
            });
        } else {
            savedSubmission = await prisma.projectSubmission.create({
                data: {
                    registrationId: registration.id, hackathonId: hackathonId,
                    submissionUrl, submissionText, status: 'PENDING_REVIEW'
                }
            });
        }
        res.status(existingSubmission ? 200 : 201).json(savedSubmission);

    } catch (error) {
        console.error('Error submitting project:', error);
        res.status(500).json({ error: 'Failed to submit project.' });
    }
};
