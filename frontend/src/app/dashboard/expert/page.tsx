'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconLoader2, IconCalendar, IconBuildingCommunity, IconUsers, IconFileText } from '@tabler/icons-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';

interface HostedHackathon {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  registrationEndDate: string;
  submissionEndDate: string;
  status: string;
  displayStatus: string;
  company?: { name: string };
  _count: {
    registrations: number;
    submissions: number;
  };
}

export default function ExpertDashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [hostedHackathons, setHostedHackathons] = useState<HostedHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && (!user || user.publicMetadata?.role !== 'EXPERT')) {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    const fetchHostedHackathons = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user || user.publicMetadata?.role !== 'EXPERT') {
          setLoading(false);
          return;
        }

        const token = await getToken();
        const response = await axios.get<HostedHackathon[]>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me/hackathons`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHostedHackathons(response.data);
      } catch (err: any) {
        console.error('Failed to fetch hosted hackathons:', err);
        setError(err.response?.data?.error || 'Failed to load your hackathons.');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn && user) {
      fetchHostedHackathons();
    }
  }, [isLoaded, isSignedIn, user, getToken]);

  const getStatusColors = (displayStatus: string) => {
    switch (displayStatus.toLowerCase()) {
      case 'registration open': return 'bg-green-100 text-green-800 border-green-300';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'registration closed': return 'bg-red-100 text-red-800 border-red-300';
      case 'judging': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };


  if (loading || !isLoaded || (isLoaded && user && user.publicMetadata?.role !== 'EXPERT')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
        <p className="ml-2 font-outfit text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-500 text-lg font-outfit mb-4">{error}</p>
        <Link href="/" className="text-yellow-300/70 hover:underline font-medium">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full font-outfit bg-gray-50"
    >
      {/* Navbar */}
      <section className="flex px-4 sm:px-10 md:px-20 mt-5 mb-4">
        <Navbar />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl md:text-4xl font-poppins font-semibold text-gray-900">
            Your Hosted Hackathons
          </h1>
          <Link href="/hackathons/create">
            <button className="bg-yellow-300/70 hover:bg-yellow-300/60 text-black font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200">
              Host New Hackathon
            </button>
          </Link>
        </div>

        {hostedHackathons.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600 text-lg">You haven't hosted any hackathons yet.</p>
            <p className="mt-4 text-gray-500">Click "Host New Hackathon" to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hostedHackathons.map((hackathon) => (
              <div
                key={hackathon.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 flex flex-col"
              >
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
                    {hackathon.title}
                  </h2>
                  <p className="text-gray-600 text-sm font-outfit mb-3">
                    {hackathon.company && `Hosted by ${hackathon.company.name}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mb-4">
                    <span className="flex items-center gap-1">
                      <IconCalendar size={16} />
                      {format(new Date(hackathon.startDate), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(hackathon.endDate), 'MMM dd, yyyy')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColors(hackathon.displayStatus)}`}>
                      {hackathon.displayStatus}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-around items-center bg-gray-50 p-3 rounded-md mb-4">
                    <div className="flex items-center gap-1 text-gray-700 font-medium">
                      <IconUsers size={18} />
                      <span>{hackathon._count.registrations} Registered</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700 font-medium">
                      <IconFileText size={18} />
                      <span>{hackathon._count.submissions} Submissions</span>
                    </div>
                  </div>

                  {/* Action Buttons for Expert */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <Link href={`/hackathons/${hackathon.slug}`} className="flex-1">
                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 w-full">
                            View Details
                        </button>
                    </Link>

                    <Link href={`/hackathons/${hackathon.id}/analytics`} className="flex-1">
                        <button className="bg-blue-300/70 hover:bg-blue-300/60 text-black font-semibold py-2 px-4 rounded-lg transition-colors duration-200 w-full">
                            View Analytics
                        </button>
                    </Link>
                    <Link href={`/hackathons/${hackathon.id}/edit`} className="flex-1">
                        <button className="bg-yellow-300/70 hover:bg-yellow-300/60 text-black font-semibold py-2 px-4 rounded-lg transition-colors duration-200 w-full">
                            Edit Hackathon
                        </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </motion.div>
  );
}
