import { DefaultSessionClaims } from '@clerk/nextjs/server';

declare module '@clerk/nextjs/server' {
  interface SessionClaims extends DefaultSessionClaims {
    publicMetadata: {
      role?: 'STUDENT' | 'EXPERT' | 'ADMIN';
      username?: string;
    };
  }
}

declare module '@clerk/nextjs' {
  interface UserResource {
    publicMetadata: {
      role?: 'STUDENT' | 'EXPERT' | 'ADMIN';
      username?: string;
    };
  }
}
