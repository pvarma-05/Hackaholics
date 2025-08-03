
import { clerkClient } from '@clerk/clerk-sdk-node';

export const createStudentProfile = async (req, res) => {
  const prisma = req.prisma;
  const clerkClient = req.clerkClient;
  const { clerkId, role, name, username, email, profileImageUrl, ...rest } = req.body;

  try {
    
    await clerkClient.users.updateUser(clerkId, { username });

    
    
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: role,
        username: username,
        
      },
    });

    
    const user = await prisma.user.create({
      data: {
        clerkId,
        username,
        name,
        email,
        profileImageUrl,
        role,
        studentProfile: { create: rest },
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Create student profile error:', error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Username is already taken' });
    res.status(500).json({ error: 'Failed to create profile' });
  }
};

export const createExpertProfile = async (req, res) => {
  const prisma = req.prisma;
  const clerkClient = req.clerkClient;
  const { clerkId, role, companyId, isApprovedInCompany, name, username, email, profileImageUrl, specialty, skills, bio, interests } = req.body;

  try {
    
    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        return res.status(400).json({ error: 'Invalid company ID' });
      }
    }

    
    await clerkClient.users.updateUser(clerkId, { username });

    
    
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: role,
        username: username,
        
      },
    });

    
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
            create: { specialty, skills, bio, interests, companyId: companyId || null, isApprovedInCompany },
            update: { specialty, skills, bio, interests, companyId: companyId || null, isApprovedInCompany },
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
          create: { specialty, skills, bio, interests, companyId: companyId || null, isApprovedInCompany },
        },
      },
      include: { expertProfile: true },
    });

    if (!user.expertProfile) {
      throw new Error('Failed to create or retrieve expert profile');
    }

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
    if (error.code === 'P2002') return res.status(400).json({ error: 'Username is already taken' });
    if (error.meta?.code === 'user_not_found') return res.status(404).json({ error: 'Clerk user not found' });
    res.status(500).json({ error: error.message || 'Failed to create profile' });
  }
};


export const updateExpertCompany = async (req, res) => {
  const prisma = req.prisma;
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
      data: { companyId, isApprovedInCompany },
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update expert profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getProfileByUsername = async (req, res) => {
  const prisma = req.prisma;
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        clerkId: true,
        username: true,
        name: true,
        profileImageUrl: true,
        role: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        studentProfile: {
          select: {
            specialty: true,
            skills: true,
            bio: true,
            interests: true,
            location: true,
            timezone: true,
            occupation: true,
            studentLevel: true,
            schoolName: true,
            graduationMonth: true,
            graduationYear: true,
            birthMonth: true,
            birthYear: true,
          },
        },
        expertProfile: {
          select: {
            specialty: true,
            skills: true,
            bio: true,
            interests: true,
            company: { select: { id: true, name: true } },
            isApprovedInCompany: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
      clerkId: user.clerkId,
      username: user.username,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      githubUrl: user.githubUrl || null,
      linkedinUrl: user.linkedinUrl || null,
      twitterUrl: user.twitterUrl || null,
      bio: user.studentProfile?.bio || user.expertProfile?.bio || null,
      skills: user.studentProfile?.skills || user.expertProfile?.skills || [],
      interests: user.studentProfile?.interests || user.expertProfile?.interests || [],
    };

    if (user.role === 'STUDENT') {
      profile.location = user.studentProfile?.location || null;
      profile.specialty = user.studentProfile?.specialty || null;
      profile.timezone = user.studentProfile?.timezone || null;
      profile.occupation = user.studentProfile?.occupation || null;
      profile.studentLevel = user.studentProfile?.studentLevel || null;
      profile.schoolName = user.studentProfile?.schoolName || null;
      profile.graduationMonth = user.studentProfile?.graduationMonth || null;
      profile.graduationYear = user.studentProfile?.graduationYear || null;
      profile.birthMonth = user.studentProfile?.birthMonth || null;
      profile.birthYear = user.studentProfile?.birthYear || null;
    } else if (user.role === 'EXPERT') {
      profile.specialty = user.expertProfile?.specialty || null;
      profile.company = user.expertProfile?.company || null;
      profile.isApprovedInCompany = user.expertProfile?.isApprovedInCompany || false;
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  const prisma = req.prisma;
  const { clerkId, name, githubUrl, linkedinUrl, twitterUrl, bio } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { studentProfile: true, expertProfile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        name,
        githubUrl: githubUrl || null,
        linkedinUrl: linkedinUrl || null,
        twitterUrl: twitterUrl || null,
        studentProfile: user.studentProfile ? { update: { bio: bio || null } } : undefined,
        expertProfile: user.expertProfile ? { update: { bio: bio || null } } : undefined,
      },
      include: { studentProfile: true, expertProfile: true },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updateProfileImage = async (req, res) => {
  const prisma = req.prisma;
  const clerkClient = req.clerkClient;
  const clerkId = req.body.clerkId; 
  const files = req.files; 

  try {
    
    if (!clerkId) {
      return res.status(400).json({ error: 'Clerk ID is required' });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const image = files.find(file => file.fieldname === 'image');
    if (!image) {
      return res.status(400).json({ error: 'Image file not found in request' });
    }

    
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    const updatedClerkUser = await clerkClient.users.updateUser(clerkId, {
      profileImage: image.buffer, 
    });

    
    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: { profileImageUrl: updatedClerkUser.imageUrl },
      select: { profileImageUrl: true },
    });

    res.json({ profileImageUrl: updatedUser.profileImageUrl });
  } catch (error) {
    console.error('Update profile image error:', error);
    if (error.meta?.code === 'user_not_found') {
      return res.status(404).json({ error: 'Clerk user not found' });
    }
    return res.status(500).json({ error: 'Failed to update profile image' });
  }
};

export const updateStudentProfile = async (req, res) => {
  const prisma = req.prisma;
  const { clerkId, specialty, skills, interests, location, timezone, occupation, studentLevel, schoolName, graduationMonth, graduationYear, birthMonth, birthYear } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { studentProfile: true },
    });

    if (!user || !user.studentProfile) {
      return res.status(400).json({ error: 'Student profile not found' });
    }

    const updatedProfile = await prisma.studentProfile.update({
      where: { id: user.studentProfile.id },
      data: {
        specialty,
        skills,
        interests,
        location,
        timezone,
        occupation,
        studentLevel,
        schoolName,
        graduationMonth,
        graduationYear,
        birthMonth,
        birthYear,
      },
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ error: 'Failed to update student profile' });
  }
};

export const updateExpertProfile = async (req, res) => {
  const prisma = req.prisma;
  const { clerkId, specialty, skills, interests, companyId } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { expertProfile: true },
    });

    if (!user || !user.expertProfile) {
      return res.status(400).json({ error: 'Expert profile not found' });
    }

    const data = { specialty, skills, interests };
    if (companyId && companyId !== user.expertProfile.companyId) {
      data.companyId = companyId;
      data.isApprovedInCompany = false;
      await prisma.companyJoinRequest.create({
        data: {
          expertProfileId: user.expertProfile.id,
          companyId,
          status: 'PENDING',
        },
      });
    }

    const updatedProfile = await prisma.expertProfile.update({
      where: { id: user.expertProfile.id },
      data,
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update expert profile error:', error);
    res.status(500).json({ error: 'Failed to update expert profile' });
  }
};

export const updateAccount = async (req, res) => {
  const prisma = req.prisma;
  const clerkClient = req.clerkClient;
  const { clerkId, username, email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    
    const clerkUpdateData = {}; 
    const prismaUpdateData = {}; 

    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) return res.status(400).json({ error: 'Username already taken' });
      clerkUpdateData.username = username;
      prismaUpdateData.username = username;
      
      clerkUpdateData.publicMetadata = { ...(clerkUpdateData.publicMetadata || {}), username: username };
    }

    if (email && email !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) return res.status(400).json({ error: 'Email already taken' });
      prismaUpdateData.email = email;
      
      clerkUpdateData.publicMetadata = { ...(clerkUpdateData.publicMetadata || {}), email: email };
    }

    
    if (Object.keys(clerkUpdateData).length > 0) {
      await clerkClient.users.updateUser(clerkId, clerkUpdateData);
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: prismaUpdateData,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update account error:', error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Failed to update account' });
  }
};
