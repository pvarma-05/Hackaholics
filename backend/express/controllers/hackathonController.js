import slugify from 'slugify';


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
  while (await prisma.hackathon.findUnique({ where: { slug: hackathonSlug } })) { hackathonSlug = `${baseSlug}-${counter}`; counter++; }

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
    if (error.code === 'P2002' && error.meta?.target?.includes('title')) { return res.status(400).json({ error: 'Hackathon with this title already exists.' }); }
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

const isCuid = (str) => typeof str === 'string' && str.length === 25;

export const getHackathonBySlug = async (req, res) => {
  const prisma = req.prisma;
  const { slug } = req.params;

  console.log(`\n--- ENTERING getHackathonBySlug function ---`);
  console.log(`  req.params object:`, req.params);
  console.log(`  Received param "slug": "${slug}" (Type: ${typeof slug}, Length: ${slug?.length})`);
  console.log(`  Is it a CUID? ${isCuid(slug)}`);
  console.log(`-------------------------------------------\n`);

  const clerkUserId = req.auth?.userId;
  const internalUserId = await getInternalUserIdByClerkId(prisma, clerkUserId);

  try {
    let hackathon;
    if (isCuid(slug)) {
      hackathon = await prisma.hackathon.findUnique({
        where: { id: slug },
        include: {
          createdBy: { select: { id: true, name: true, username: true, profileImageUrl: true, clerkId: true } },
          company: { select: { id: true, name: true, websiteUrl: true } },
        },
      });
    } else {
      hackathon = await prisma.hackathon.findUnique({
        where: { slug: slug },
        include: {
          createdBy: { select: { id: true, name: true, username: true, profileImageUrl: true, clerkId: true } },
          company: { select: { id: true, name: true, websiteUrl: true } },
        },
      });
    }

    if (!hackathon) {
      console.warn(`Hackathon with slug/ID "${slug}" not found in DB. Returning 404.`);
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    let isRegistered = false;
    let currentUserSubmission = null;
    let foundRegistration = null;

    if (internalUserId) {
      foundRegistration = await prisma.hackathonRegistration.findUnique({
        where: {
          hackathonId_userId: { hackathonId: hackathon.id, userId: internalUserId },
        },
        include: { submission: true }
      });
      if (foundRegistration) {
        isRegistered = true;
        currentUserSubmission = foundRegistration.submission;
      }
    }
    const hasSubmitted = !!currentUserSubmission;

    console.log(`\n--- getHackathonBySlug Debug (ORM Query Result - Attempt #${Math.floor(Math.random() * 1000)}) ---`);
    console.log(`Slug: ${slug}, Hackathon ID (found): "${hackathon.id}" (Length: ${hackathon.id.length})`);
    console.log(`Clerk User ID: ${clerkUserId}, Internal DB User ID: "${internalUserId}" (Length: ${internalUserId?.length})`);
    console.log(`Query Result: isRegistered = ${isRegistered}, hasSubmitted = ${hasSubmitted}`);
    if (isRegistered) {
      console.log(`  Found Registration (ID from ORM): "${foundRegistration?.id}" (Length: ${foundRegistration?.id?.length})`);
      console.log(`  Found Registration (Hackathon ID in DB from ORM): "${foundRegistration?.hackathonId}" (Length: ${foundRegistration?.hackathonId?.length})`);
      console.log(`  Found Registration (User ID in DB from ORM): "${foundRegistration?.userId}" (Length: ${foundRegistration?.userId?.length})`);
      console.log(`  Found Submission: `, currentUserSubmission);
    }
    console.log(`--------------------------------------------------------\n`);


    const now = new Date();
    let displayStatus = hackathon.status;
    if (now < hackathon.registrationEndDate) { displayStatus = 'REGISTRATION_OPEN'; }
    else if (now >= hackathon.registrationEndDate && now < hackathon.submissionEndDate) { displayStatus = 'REGISTRATION_CLOSED'; }
    else if (now >= hackathon.submissionEndDate && now < hackathon.endDate) { displayStatus = 'JUDGING'; }
    else if (now >= hackathon.endDate && hackathon.status !== 'COMPLETED' && hackathon.status !== 'ARCHIVED') { displayStatus = 'COMPLETED'; }

    const hackathonResponse = {
      ...hackathon, isRegistered, hasSubmitted, currentUserSubmission, displayStatus: displayStatus.replaceAll('_', ' '),
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
  const { id: currentUserId, role: currentUserRole } = req.user;
  const updateData = req.body;

  try {
    const existingHackathon = await prisma.hackathon.findUnique({
      where: { id },
      select: { createdByUserId: true, companyId: true }
    });
    if (!existingHackathon) return res.status(404).json({ error: 'Hackathon not found.' });

    let isAuthorized = false;
    if (existingHackathon.createdByUserId === currentUserId) { isAuthorized = true; }
    else if (currentUserRole === 'ADMIN') { isAuthorized = true; }
    else if (existingHackathon.companyId && currentUserRole === 'EXPERT') {
      const currentExpertProfile = await prisma.expertProfile.findUnique({
        where: { userId: currentUserId },
        select: { companyId: true, isApprovedInCompany: true }
      });
      if (currentExpertProfile && currentExpertProfile.isApprovedInCompany &&
        currentExpertProfile.companyId === existingHackathon.companyId) { isAuthorized = true; }
    }

    if (!isAuthorized) { return res.status(403).json({ error: 'Unauthorized: You do not have permission to edit this hackathon.' }); }

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
    if (existingHackathon.createdByUserId !== userId && role !== 'ADMIN') { return res.status(403).json({ error: 'Unauthorized: You are not the creator or an Admin for this hackathon.' }); }
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
  if (!internalUserId) { return res.status(400).json({ error: 'Invalid user for registration.' }); }

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
  if (!internalUserId) { return res.status(400).json({ error: 'Invalid user for submission.' }); }

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

export const getHackathonParticipants = async (req, res) => {
  const prisma = req.prisma;
  const { id: hackathonId } = req.params;
  const { id: currentUserId, role: currentUserRole } = req.user;

  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { createdByUserId: true, companyId: true }
    });
    if (!hackathon) { return res.status(404).json({ error: 'Hackathon not found.' }); }

    let isAuthorized = false;
    if (hackathon.createdByUserId === currentUserId) { isAuthorized = true; }
    else if (currentUserRole === 'ADMIN') { isAuthorized = true; }
    else if (hackathon.companyId && currentUserRole === 'EXPERT') {
      const currentExpertProfile = await prisma.expertProfile.findUnique({
        where: { userId: currentUserId },
        select: { companyId: true, isApprovedInCompany: true }
      });
      if (currentExpertProfile && currentExpertProfile.isApprovedInCompany && currentExpertProfile.companyId === hackathon.companyId) { isAuthorized = true; }
    }
    if (!isAuthorized) { return res.status(403).json({ error: 'Unauthorized: You do not have permission to view participants for this hackathon.' }); }

    const registrations = await prisma.hackathonRegistration.findMany({
      where: { hackathonId: hackathonId },
      include: {
        user: {
          select: {
            id: true, username: true, name: true, profileImageUrl: true, role: true,
            studentProfile: { select: { specialty: true, skills: true, location: true } },
            expertProfile: { select: { specialty: true, skills: true, company: { select: { name: true } } } }
          }
        }
      }
    });

    const participants = registrations.map(reg => ({
      id: reg.user.id, username: reg.user.username, name: reg.user.name, profileImageUrl: reg.user.profileImageUrl, role: reg.user.role, registeredAt: reg.registeredAt,
      details: reg.user.role === 'STUDENT' ? { specialty: reg.user.studentProfile?.specialty, skills: reg.user.studentProfile?.skills, location: reg.user.studentProfile?.location }
        : { specialty: reg.user.expertProfile?.specialty, skills: reg.user.expertProfile?.skills, companyName: reg.user.expertProfile?.company?.name }
    }));
    res.json(participants);

  } catch (error) {
    console.error('Error fetching hackathon participants:', error);
    res.status(500).json({ error: 'Failed to fetch hackathon participants.' });
  }
};

export const getHackathonSubmissions = async (req, res) => {
  const prisma = req.prisma;
  const { hackathonId } = req.params;
  const { id: currentUserId, role: currentUserRole } = req.user;

  console.log(`\n--- ENTERING getHackathonSubmissions function ---`);
  console.log(`  req.params object:`, req.params);
  console.log(`  Received hackathonId: "${hackathonId}" (Type: ${typeof hackathonId}, Length: ${hackathonId?.length})`);
  console.log(`---------------------------------------------\n`);

  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { createdByUserId: true, companyId: true, submissionEndDate: true }
    });
    if (!hackathon) {
      console.warn(`Hackathon with ID "${hackathonId}" not found.`);
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    let isAuthorized = false;
    if (hackathon.createdByUserId === currentUserId) { isAuthorized = true; }
    else if (currentUserRole === 'ADMIN') { isAuthorized = true; }
    else if (hackathon.companyId && currentUserRole === 'EXPERT') {
      const currentExpertProfile = await prisma.expertProfile.findUnique({
        where: { userId: currentUserId },
        select: { companyId: true, isApprovedInCompany: true }
      });
      if (currentExpertProfile && currentExpertProfile.isApprovedInCompany && currentExpertProfile.companyId === hackathon.companyId) {
        isAuthorized = true;
      }
    }
    if (!isAuthorized) {
      console.warn(`Unauthorized attempt to access submissions for hackathon ${hackathonId} by user ${currentUserId} (Role: ${currentUserRole})`);
      return res.status(403).json({ error: 'Unauthorized: You do not have permission to view submissions for this hackathon.' });
    }

    const submissions = await prisma.projectSubmission.findMany({
      where: { hackathonId: hackathonId },
      include: {
        registration: {
          include: {
            user: {
              select: {
                id: true, username: true, name: true, profileImageUrl: true, role: true,
              }
            }
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });

    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      submitterId: sub.registration.user.id,
      submitterUsername: sub.registration.user.username,
      submitterName: sub.registration.user.name,
      submitterProfileImageUrl: sub.registration.user.profileImageUrl,
      submissionUrl: sub.submissionUrl,
      submissionText: sub.submissionText,
      score: sub.score,
      manualReviewScore: sub.manualReviewScore, 
      feedback: sub.feedback,
      status: sub.status,
      submittedAt: sub.submittedAt,
      hackathonId: sub.hackathonId, 
      hackathonSubmissionEndDate: hackathon.submissionEndDate
    }));
    res.json(formattedSubmissions);

  } catch (error) {
    console.error('Error fetching hackathon submissions:', error);
    res.status(500).json({ error: 'Failed to fetch hackathon submissions.' });
  }
};


export const reviewSubmission = async (req, res) => {
    const prisma = req.prisma;
    const { id: submissionId } = req.params;
    const { score, feedback } = req.body;
    const { id: currentUserId, role: currentUserRole } = req.user;

    console.log(`\n--- ENTERING reviewSubmission function ---`);
    console.log(`  submissionId: "${submissionId}" (Type: ${typeof submissionId}, Length: ${submissionId?.length})`);
    console.log(`  score: ${score} (Type: ${typeof score})`);
    console.log(`  feedback: "${feedback}" (Type: ${typeof feedback})`);
    console.log(`  currentUserId: "${currentUserId}", currentUserRole: "${currentUserRole}"`);
    console.log(`---------------------------------------------\n`);

    if (score === undefined || score === null || isNaN(score) || score < 0 || score > 100) {
        console.warn(`Invalid score received: ${score}`);
        return res.status(400).json({ error: 'Score must be a number between 0 and 100.' });
    }
    if (feedback && typeof feedback !== 'string') {
        console.warn(`Invalid feedback received: ${feedback}`);
        return res.status(400).json({ error: 'Feedback must be a string.' });
    }

    try {
        
        const submission = await prisma.projectSubmission.findUnique({
            where: { id: submissionId },
            include: {
                hackathon: {
                    select: {
                        id: true,
                        createdByUserId: true,
                        companyId: true,
                        submissionEndDate: true,
                        slug: true 
                    }
                },
                registration: {
                    include: {
                        user: {
                            select: { id: true, username: true, name: true, profileImageUrl: true }
                        }
                    }
                }
            }
        });

        if (!submission) {
            console.warn(`Submission with ID "${submissionId}" not found.`);
            
            const allSubmissions = await prisma.projectSubmission.findMany({
                select: { id: true, hackathonId: true, registrationId: true, submittedAt: true }
            });
            console.log(`All submissions in database:`, allSubmissions);
            
            const hackathonSubmissions = await prisma.projectSubmission.findMany({
                where: { hackathonId: 'cmdwyjinh00053kmc6xrigdjx' },
                select: { id: true, hackathonId: true, registrationId: true, submittedAt: true }
            });
            console.log(`Submissions for hackathon cmdwyjinh00053kmc6xrigdjx:`, hackathonSubmissions);
            return res.status(404).json({ error: 'Submission not found.' });
        }
        if (!submission.hackathon) {
            console.error(`Associated hackathon not found for submission ${submissionId}.`);
            return res.status(500).json({ error: 'Associated hackathon not found for submission.' });
        }
        if (!submission.registration) {
            console.error(`Associated registration not found for submission ${submissionId}.`);
            return res.status(500).json({ error: 'Associated registration not found for submission.' });
        }

        console.log(`Found submission:`, {
            id: submission.id,
            hackathonId: submission.hackathon.id,
            hackathonSlug: submission.hackathon.slug,
            registrationId: submission.registration.id
        });

        let isAuthorizedToReview = false;
        if (submission.hackathon.createdByUserId === currentUserId) {
            isAuthorizedToReview = true;
            console.log(`Authorized as creator (hackathon.createdByUserId: ${submission.hackathon.createdByUserId})`);
        } else if (currentUserRole === 'ADMIN') {
            isAuthorizedToReview = true;
            console.log(`Authorized as ADMIN (currentUserRole: ${currentUserRole})`);
        } else if (submission.hackathon.companyId && currentUserRole === 'EXPERT') {
            const currentExpertProfile = await prisma.expertProfile.findUnique({
                where: { userId: currentUserId },
                select: { companyId: true, isApprovedInCompany: true }
            });
            console.log(`Expert check - currentExpertProfile:`, currentExpertProfile);
            if (currentExpertProfile && currentExpertProfile.isApprovedInCompany && currentExpertProfile.companyId === submission.hackathon.companyId) {
                isAuthorizedToReview = true;
                console.log(`Authorized as company expert (companyId: ${currentExpertProfile.companyId} matches hackathon.companyId: ${submission.hackathon.companyId})`);
            }
        }
        if (!isAuthorizedToReview) {
            console.warn(`Unauthorized attempt to review submission ${submissionId} by user ${currentUserId} (Role: ${currentUserRole})`);
            return res.status(403).json({ error: 'Unauthorized: You do not have permission to review this submission.' });
        }

        const now = new Date();
        if (now < submission.hackathon.submissionEndDate) {
            console.warn(`Submission deadline not passed for hackathon ${submission.hackathon.id}. Current time: ${now}, submissionEndDate: ${submission.hackathon.submissionEndDate}`);
            return res.status(400).json({ error: 'Submissions can only be reviewed after the submission deadline has passed.' });
        }

        const updatedSubmission = await prisma.projectSubmission.update({
            where: { id: submissionId },
            data: {
                manualReviewScore: score,
                feedback: feedback || null,
                status: 'REVIEWED_MANUAL'
            },
            include: {
                registration: {
                    include: {
                        user: {
                            select: { id: true, username: true, name: true, profileImageUrl: true }
                        }
                    }
                },
                hackathon: { select: { id: true, submissionEndDate: true } }
            }
        });

        console.log(`Successfully reviewed submission ${submissionId}. Updated data:`, {
            manualReviewScore: updatedSubmission.manualReviewScore,
            feedback: updatedSubmission.feedback,
            status: updatedSubmission.status
        });

        const formattedSubmission = {
            id: updatedSubmission.id,
            submitterId: updatedSubmission.registration.user.id,
            submitterUsername: updatedSubmission.registration.user.username,
            submitterName: updatedSubmission.registration.user.name,
            submitterProfileImageUrl: updatedSubmission.registration.user.profileImageUrl,
            submissionUrl: updatedSubmission.submissionUrl,
            submissionText: updatedSubmission.submissionText,
            score: updatedSubmission.score,
            manualReviewScore: updatedSubmission.manualReviewScore,
            feedback: updatedSubmission.feedback,
            status: updatedSubmission.status,
            submittedAt: updatedSubmission.submittedAt,
            hackathonId: updatedSubmission.hackathon.id,
            hackathonSubmissionEndDate: updatedSubmission.hackathon.submissionEndDate
        };

        res.json(formattedSubmission);
    } catch (error) {
        console.error('Error reviewing submission:', error);
        res.status(500).json({ error: 'Failed to review submission.' });
    }
};

const getInternalUserIdByClerkId = async (prismaInstance, clerkId) => {
  if (!clerkId) return null;
  const user = await prismaInstance.user.findUnique({
    where: { clerkId: clerkId },



    select: { id: true }
  });
  return user ? user.id : null;
};

export const getHackathonAnalytics = async (req, res) => {
  const prisma = req.prisma;
  const { hackathonId } = req.params; 
  const { id: currentUserIdRaw, role: currentUserRole } = req.user;
  const currentUserId = currentUserIdRaw.trim();

  console.log(`\n--- ENTERING getHackathonAnalytics function ---`);
  console.log(`  req.params object:`, req.params);
  console.log(`  Received hackathonIdentifier: "${hackathonId}" (Type: ${typeof hackathonId}, Length: ${hackathonId?.length})`);
  console.log(`---------------------------------------------\n`);

  const isCuid = (str) => typeof str === 'string' && str.length === 25;

  try {
    let hackathon;
    if (isCuid(hackathonId)) {
      hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: {
          id: true, title: true, slug: true, createdByUserId: true, companyId: true, submissionEndDate: true, reviewType: true
        }
      });
    } else {
      hackathon = await prisma.hackathon.findUnique({
        where: { slug: hackathonId },
        select: {
          id: true, title: true, slug: true, createdByUserId: true, companyId: true, submissionEndDate: true, reviewType: true
        }
      });
    }

    if (!hackathon) {
      console.warn(`Hackathon with identifier "${hackathonId}" not found.`);
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    const hackathonCreatorId = hackathon.createdByUserId.trim();
    const hackathonCompanyId = hackathon.companyId ? hackathon.companyId.trim() : null;

    let isAuthorized = false;
    if (hackathonCreatorId === currentUserId) {
      isAuthorized = true;
      console.log(`Authorized as creator (hackathon.createdByUserId: ${hackathonCreatorId})`);
    } else if (currentUserRole === 'ADMIN') {
      isAuthorized = true;
      console.log(`Authorized as ADMIN (currentUserRole: ${currentUserRole})`);
    } else if (hackathonCompanyId && currentUserRole === 'EXPERT') {
      const currentExpertProfile = await prisma.expertProfile.findUnique({
        where: { userId: currentUserId },
        select: { companyId: true, isApprovedInCompany: true }
      });
      console.log(`Expert check - currentExpertProfile:`, currentExpertProfile);
      if (currentExpertProfile && currentExpertProfile.isApprovedInCompany &&
        currentExpertProfile.companyId?.trim() === hackathonCompanyId) {
        isAuthorized = true;
        console.log(`Authorized as company expert (companyId: ${currentExpertProfile.companyId} matches hackathon.companyId: ${hackathonCompanyId})`);
      }
    }
    if (!isAuthorized) {
      console.warn(`Unauthorized attempt to access analytics for hackathon ${hackathon.id} by user ${currentUserId} (Role: ${currentUserRole})`);
      return res.status(403).json({ error: 'Unauthorized: You do not have permission to view analytics for this hackathon.' });
    }

    const registrationsWithSubmissions = await prisma.hackathonRegistration.findMany({
      where: { hackathonId: hackathon.id },
      include: {
        user: {
          select: {
            id: true, username: true, name: true, profileImageUrl: true, role: true,
            studentProfile: { select: { specialty: true, skills: true, location: true, schoolName: true } },
            expertProfile: { select: { specialty: true, skills: true, company: { select: { name: true } } } }
          }
        },
        submission: true
      },
      orderBy: { registeredAt: 'asc' }
    });

    const registeredCount = registrationsWithSubmissions.length;
    const submittedCount = registrationsWithSubmissions.filter(reg => reg.submission).length;

    const participantsAndSubmissions = registrationsWithSubmissions.map(reg => {
      const isSubmitted = !!reg.submission;
      const submissionStatus = reg.submission?.status || 'NOT_SUBMITTED';
      const submissionScore = reg.submission?.score || reg.submission?.manualReviewScore;
      const submissionFeedback = reg.submission?.feedback;
      const submissionUrl = reg.submission?.submissionUrl;
      const submissionText = reg.submission?.submissionText;
      const submissionId = reg.submission?.id;
      const submittedAt = reg.submission?.submittedAt;

      return {
        id: reg.id, userId: reg.user.id, username: reg.user.username, name: reg.user.name,
        profileImageUrl: reg.user.profileImageUrl, role: reg.user.role, registeredAt: reg.registeredAt,
        isSubmitted: isSubmitted, submissionId: submissionId,
        submissionStatus: submissionStatus.replace('_', ' '), submissionScore: submissionScore,
        submissionFeedback: submissionFeedback, submissionUrl: submissionUrl, submissionText: submissionText,
        submittedAt: submittedAt,
        participantDetails: reg.user.role === 'STUDENT' ? {
          specialty: reg.user.studentProfile?.specialty,
          skills: reg.user.studentProfile?.skills,
          location: reg.user.studentProfile?.location,
          schoolName: reg.user.studentProfile?.schoolName
        } : {
          specialty: reg.user.expertProfile?.specialty,
          skills: reg.user.expertProfile?.skills,
          companyName: reg.user.expertProfile?.company?.name
        }
      };
    });

    console.log(`Successfully fetched analytics for hackathon ${hackathon.id}. Registered: ${registeredCount}, Submitted: ${submittedCount}`);
    res.json({
      hackathon: {
        id: hackathon.id, title: hackathon.title, slug: hackathon.slug,
        submissionEndDate: hackathon.submissionEndDate, reviewType: hackathon.reviewType
      },
      registeredCount: registeredCount,
      submittedCount: submittedCount,
      participantsAndSubmissions: participantsAndSubmissions
    });
  } catch (error) {
    console.error('Error fetching hackathon analytics:', error);
    res.status(500).json({ error: 'Failed to fetch hackathon analytics.' });
  }
};
