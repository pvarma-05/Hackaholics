'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { IconLoader2, IconBrandGithub, IconBrandLinkedin, IconBrandTwitter } from '@tabler/icons-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface Profile {
  username: string;
  name: string;
  profileImageUrl: string;
  role: 'STUDENT' | 'EXPERT';
  githubUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  location?: string | null;
  specialty?: string | null;
  company?: { id: string; name: string } | null;
  isApprovedInCompany?: boolean;
}

export default function ProfilePage() {
  const { isLoaded, user, isSignedIn } = useUser();
  const router = useRouter();
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:4000/api/profile/${username}`);
        setProfile(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 text-lg font-outfit">{error || 'Profile not found'}</p>
      </div>
    );
  }

  const isOwnProfile = user && user.username === profile.username && isSignedIn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full font-outfit"
    >
      {/* Navbar */}
      <section className="flex px-4 sm:px-10 md:px-20 mt-5 mb-4">
        <Navbar />
      </section>
      {/* Header */}
      <div className="w-full bg-gradient-to-br from-yellow-200/50 to-yellow-100 py-10 px-6 md:px-16 border-b border-yellow-300/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-6">
          <img
            src={profile.profileImageUrl || user?.imageUrl || '/default-avatar.png'}
            alt="Profile"
            className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-yellow-300/70 shadow"
          />
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-800">
                  {profile.name}
                </h1>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                <p className="text-sm text-yellow-600 font-medium mt-1">
                  {profile.role === 'EXPERT' ? 'Expert' : 'Student'}
                  {profile.company &&
                    ` • ${profile.isApprovedInCompany ? 'Approved at' : 'Pending at'} ${profile.company.name}`}
                </p>
              </div>

              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-medium text-sm px-4 py-2 rounded-lg transition"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Socials */}
            <div className="flex gap-4 mt-4">
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
                  <IconBrandGithub size={22} className="text-gray-700 hover:text-black" />
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <IconBrandLinkedin size={22} className="text-blue-600 hover:text-blue-700" />
                </a>
              )}
              {profile.twitterUrl && (
                <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer">
                  <IconBrandTwitter size={22} className="text-sky-500 hover:text-sky-600" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-10 space-y-12">
        {/* Bio */}
        {profile.bio && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Bio</h2>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {/* Location + Specialty */}
        {(profile.location || profile.specialty) && (
          <section className="flex flex-col sm:flex-row gap-6">
            {profile.location && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600">Location</h3>
                <p className="text-gray-800">{profile.location}</p>
              </div>
            )}
            {profile.specialty && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600">Specialty</h3>
                <p className="text-gray-800">{profile.specialty.replaceAll('_', ' ')}</p>
              </div>
            )}
          </section>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Interests</h2>
            <div className="flex flex-wrap gap-3">
              {profile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-gray-200 text-gray-800 px-4 py-1 rounded-full text-sm font-medium"
                >
                  {interest.replaceAll('_', ' ')}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Participation stats */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Hackathon Participation</h2>
          <p className="text-gray-600">Stats coming soon...</p>
        </section>
      </div>
      <Footer />
    </motion.div>
  );

}
