import { verifyToken } from '@clerk/clerk-sdk-node';

export default async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or Invalid Token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyToken(token);
    req.auth = payload;
    next();
  } catch (err) {
    console.error('Token Verification Failed:', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
