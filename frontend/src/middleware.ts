import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/profile/(.*)',
  '/hackathons',
  '/hackathons/(.*)',
  '/api/(.*)',
]);

const isIncompleteProfileRoute = createRouteMatcher([
  '/complete-profile(.*)',
]);

const isExpertRoute = createRouteMatcher([
  '/hackathons/create(.*)',
  '/hackathons/(.*)/analytics',
  '/hackathons/(.*)/edit',
  '/hackathons/(.*)/participants',
  '/hackathons/(.*)/submissions',
  '/hackathons/(.*)/submissions/(.*)/review',
]);

export default clerkMiddleware(async (auth, req) => {
  const authResult = await auth();
  const { userId, sessionClaims, redirectToSignIn } = authResult;

  interface CustomPublicMetadata {
    role?: 'STUDENT' | 'EXPERT' | 'ADMIN';
    username?: string;
  }
  const publicMetadataFromClaims: CustomPublicMetadata | undefined =
    (sessionClaims as any)?.public_metadata;


  // console.log('\n--- Middleware Auth Check ---');
  // console.log('Path:', req.nextUrl.pathname);
  // console.log('userId:', userId);
  // console.log('sessionClaims (raw):', sessionClaims);
  // console.log('Public Metadata from Claims (accessed via public_metadata):', publicMetadataFromClaims);
  // console.log('Role from Public Metadata:', publicMetadataFromClaims?.role);
  // console.log('Is Expert Route Match:', isExpertRoute(req));
  // console.log('-------------------------------\n');


  if (!userId && !isPublicRoute(req)) {
    console.log("Middleware: Redirecting to sign-in - Not logged in.");
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (userId) {
    const hasRole = publicMetadataFromClaims?.role;
    const hasUsername = publicMetadataFromClaims?.username;

    if (hasRole && hasUsername) {
      if (isIncompleteProfileRoute(req)) {
        console.log("Middleware: Redirecting from /complete-profile - Profile already complete.");
        return NextResponse.redirect(new URL('/', req.url));
      }
    } else {
      if (!isIncompleteProfileRoute(req) && req.nextUrl.pathname !== '/') {
        console.log("Middleware: Redirecting to /complete-profile - Profile incomplete.");
        return NextResponse.redirect(new URL('/complete-profile', req.url));
      }
    }
  }

  if (userId) {
    if (isExpertRoute(req)) {
      const userRole = publicMetadataFromClaims?.role;

      if (userRole !== 'EXPERT') {
        console.log(`Middleware: Redirecting non-EXPERT (${userRole || 'no role'}) from expert route.`);
        return NextResponse.redirect(new URL('/', req.url));
      } else {
        console.log("Middleware: Allowing EXPERT user access to expert route.");
      }
    }
  }

  console.log("Middleware: Allowing request to proceed by default.");
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next/data|_next/image).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
