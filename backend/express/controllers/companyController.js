export const getAllCompanies = async (req, res) => {
  try {
    const companies = await req.prisma.company.findMany({
      where: { approved: true },
      select: { id: true, name: true },
    });
    res.json(companies);
  } catch (error) {
    console.error('Fetch companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

export const createCompany = async (req, res) => {
  const { name, websiteUrl, description, phoneNumber, emailDomain, createdById } = req.body;
  const prisma = req.prisma;

  try {
    const user = await prisma.user.findUnique({ where: { id: createdById } });
    if (!user) return res.status(400).json({ error: 'Invalid createdById: User does not exist' });

    const company = await prisma.company.create({
      data: { name, websiteUrl, description, phoneNumber, emailDomain, createdById, approved: true }
    });
    res.json(company);
  } catch (error) {
    console.error('Create company error:', error);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Company name already exists' });
    if (error.code === 'P2003') return res.status(400).json({ error: 'Invalid createdById' });
    res.status(500).json({ error: 'Failed to create company' });
  }
};
