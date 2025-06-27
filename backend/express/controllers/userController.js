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
