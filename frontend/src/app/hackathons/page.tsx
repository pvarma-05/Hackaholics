'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconLoader2, IconCalendar, IconBuildingCommunity } from '@tabler/icons-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';


interface Hackathon {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate: string;
  registrationEndDate: string;
  submissionEndDate: string;
  status: string;
  reviewType: 'MANUAL' | 'AI';
  displayStatus: string;
  createdBy: {
    name: string;
    username: string;
  };
  company?: {
    name: string;
  };
}

export default function HackathonsPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      setError(null);
      try {

        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons`);
        setHackathons(response.data);
      } catch (err: any) {
        console.error('Failed to fetch hackathons:', err);
        setError(err.response?.data?.error || 'Failed to load hackathons.');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  const getStatusColors = (displayStatus: string) => {
    switch (displayStatus.toLowerCase()) {
      case 'registration open':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'registration closed':
      case 'submissions closed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'judging':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
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

  const isExpert = isLoaded && user && user.publicMetadata?.role === 'EXPERT';


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
            Explore Hackathons
          </h1>
          {isExpert && (
            <Link href="/hackathons/create">
              <button className="bg-yellow-300/70 hover:bg-yellow-300/60 text-black font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200">
                Host a Hackathon
              </button>
            </Link>
          )}
        </div>

        {hackathons.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600 text-lg">No hackathons available yet.</p>
            {isExpert && (
              <p className="mt-4 text-gray-500">Be the first to host one!</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hackathons.map((hackathon) => (
              <Link href={`/hackathons/${hackathon.slug}`} key={hackathon.id}>
                <motion.div
                  whileHover={{ translateY: -5 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 cursor-pointer h-full flex flex-col"
                >
                  {hackathon.bannerImageUrl && (
                    <div className="relative w-full h-48">
                      <Image
                        src={hackathon.bannerImageUrl}
                        alt={`${hackathon.title} banner`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
                      {hackathon.title}
                    </h2>
                    <p className="text-gray-600 text-sm font-outfit mb-4 flex-1 line-clamp-3">
                      {hackathon.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mb-3">
                      <span className="flex items-center gap-1">
                        <IconCalendar size={16} />
                        {format(new Date(hackathon.startDate), 'MMM dd, yyyy')}
                      </span>
                      {hackathon.company && (
                        <span className="flex items-center gap-1">
                          <IconBuildingCommunity size={16} />
                          {hackathon.company.name}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColors(hackathon.displayStatus)}`}>
                        {hackathon.displayStatus}
                      </span>
                    </div>

                    <span className="text-black hover:underline hover:underline-offset-4 hover:decoration-yellow-300 font-medium font-outfit hover:decoration-2 mt-auto">
                      View Details →
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </motion.div>
  );
}
