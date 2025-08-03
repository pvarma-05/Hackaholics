'use client';

import { useEffect } from 'react';
import { CreateHackathonForm } from '@/components/forms/CreateHackathonForm';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { IconLoader2 } from '@tabler/icons-react';

export default function CreateHackathonPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    console.log('CreateHackathonPage: isLoaded', isLoaded);
    if (isLoaded) {
      console.log('CreateHackathonPage: user object', user);
      console.log('CreateHackathonPage: user.publicMetadata', user?.publicMetadata);
      console.log('CreateHackathonPage: user.publicMetadata.role', user?.publicMetadata?.role);
      console.log('CreateHackathonPage: user.publicMetadata.username', user?.publicMetadata?.username);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded) {
      if (!user || user.publicMetadata?.role !== 'EXPERT') {
        router.push('/');
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user || user.publicMetadata?.role !== 'EXPERT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
        <p className="ml-2 font-outfit text-gray-700">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <CreateHackathonForm />
      </div>
    </div>
  );
}
