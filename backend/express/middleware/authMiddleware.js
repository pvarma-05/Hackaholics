
import prisma from '../lib/prisma.js';
/**
 * Middleware to ensure user is authenticated by Clerk and has the required role.
 * Assumes ClerkExpressRequireAuth has already run and populated req.auth.
 * Attaches user's internal DB ID, Clerk ID, and role to req.user.
 * @param {string[]} allowedRoles
 * If empty, only checks for authentication (any role allowed).
 */
export const protect = (allowedRoles = []) => async (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    console.warn('AuthMiddleware: req.auth not populated. Check middleware order.');
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const clerkId = req.auth.userId;
  const publicMetadataFromClaims = req.auth.sessionClaims?.public_metadata;
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, clerkId: true }
    });

    if (!user) {
      return res.status(403).json({ error: 'Access denied: User profile not found in Hackaholics database. Please complete your profile.' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      console.log(`AuthMiddleware: User ${user.username} (${user.role}) attempted to access protected route (allowed: ${allowedRoles.join(',')})`);
      return res.status(403).json({ error: `Access denied: Requires role(s): ${allowedRoles.join(', ')}.` });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('AuthMiddleware (Post-ClerkExpressRequireAuth) Error:', error);
    return res.status(500).json({ error: 'Internal server error during authorization.' });
  }
};
