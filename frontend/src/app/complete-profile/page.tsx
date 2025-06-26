'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

export default function RoleSelection() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [role, setRole] = useState<'STUDENT' | 'EXPERT' | null>(null);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 text-yellow-300/70" />
      </div>
    );
  }

  const handleRoleSelection = (selectedRole: 'STUDENT' | 'EXPERT') => {
    setRole(selectedRole);
    router.push(`/complete-profile/${selectedRole.toLowerCase()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">
          Select Your Role
        </h1>
        <p className="font-outfit text-gray-600 text-sm mb-6">
          Are you a student participating in hackathons or an expert hosting or participating?
        </p>
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelection('STUDENT')}
            className="w-full p-3 bg-yellow-300/70 hover:bg-yellow-300/60 rounded-lg font-outfit font-semibold text-black transition-colors duration-200"
          >
            Student
          </button>
          <button
            onClick={() => handleRoleSelection('EXPERT')}
            className="w-full p-3 bg-yellow-300/70 hover:bg-yellow-300/60 rounded-lg font-outfit font-semibold text-black transition-colors duration-200"
          >
            Expert
          </button>
        </div>
      </div>
    </motion.div>
  );
}
