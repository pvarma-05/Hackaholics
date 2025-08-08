'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconLoader2, IconCalendar, IconCheck, IconLink, IconStar, IconTrophy, IconRocket } from '@tabler/icons-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';

interface HackathonDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  rules?: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate: string;
  registrationEndDate: string;
  submissionEndDate: string;
  status: string;
  reviewType: 'MANUAL' | 'AI';
  displayStatus: string;
  createdBy: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string;
  };
  company?: {
    id: string;
    name: string;
    websiteUrl?: string;
  };
  isRegistered: boolean;
  hasSubmitted: boolean;
  currentUserSubmission?: ProjectSubmission | null;
}

interface ProjectSubmission {
  id: string;
  submissionUrl?: string;
  submissionText?: string;
  score?: number;
  manualReviewScore?: number;
  feedback?: string;
  status: string;
  submittedAt: string;
}


export default function HackathonDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [hackathon, setHackathon] = useState<HackathonDetail | null>(null);
  const [userSubmission, setUserSubmission] = useState<ProjectSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');

  useEffect(() => {
    const fetchHackathonDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = isSignedIn ? await getToken() : undefined;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get<HackathonDetail>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${slug}`,
          { headers }
        );
        setHackathon(response.data);
        if (response.data.isRegistered && response.data.hasSubmitted && response.data.currentUserSubmission) {
          setUserSubmission(response.data.currentUserSubmission);
        } else {
          setUserSubmission(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch hackathon details:', err);
        setError(err.response?.data?.error || 'Failed to load hackathon details.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchHackathonDetails();
    }
  }, [slug, isSignedIn, user, getToken]);

  const handleRegister = async () => {
    if (!user || !isSignedIn || !hackathon) return;
    setRegistering(true);
    setError(null);
    try {
      const token = await getToken();
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${hackathon.id}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHackathon(prev => prev ? { ...prev, isRegistered: true } : null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to register:', err);


      if (err.response?.data?.error === 'Already registered for this hackathon.') {
        setHackathon(prev => prev ? { ...prev, isRegistered: true } : null);
        setError('You are already registered for this hackathon.');
      } else {
        setError(err.response?.data?.error || 'Failed to register for hackathon.');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isSignedIn || !hackathon || !hackathon.isRegistered) return;
    setSubmittingProject(true);
    setError(null);

    if (!submissionContent.trim()) {
        setError('Submission URL or text cannot be empty.');
        setSubmittingProject(false);
        return;
    }

    try {
      const token = await getToken();
      const payload = submissionContent.startsWith('http://') || submissionContent.startsWith('https://')
        ? { submissionUrl: submissionContent.trim() }
        : { submissionText: submissionContent.trim() };
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${hackathon.id}/submit`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserSubmission(response.data);
      setHackathon(prev => prev ? { ...prev, hasSubmitted: true } : null);
      setError(null);
      setSubmissionContent('');
    } catch (err: any) {
      console.error('Failed to submit project:', err);
      setError(err.response?.data?.error || 'Failed to submit project.');
    } finally {
      setSubmittingProject(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
        <span className="ml-2 text-gray-700 font-outfit">Loading...</span>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-red-500 text-lg font-outfit mb-4">{error || 'Hackathon not found'}</p>
        <Link href="/hackathons" className="text-yellow-300/70 hover:underline font-medium font-outfit">
          Back to Hackathons
        </Link>
      </div>
    );
  }

  const isCreator = isSignedIn && user?.id === hackathon.createdBy.id;
  const isStudent = isSignedIn && user?.publicMetadata?.role === 'STUDENT';

  const now = new Date();
  const registrationOpen = now < new Date(hackathon.registrationEndDate);
  const submissionOpen = now >= new Date(hackathon.registrationEndDate) && now < new Date(hackathon.submissionEndDate);

  const sanitizedDescription = { __html: DOMPurify.sanitize(hackathon.description) };
  const sanitizedRules = hackathon.rules ? { __html: DOMPurify.sanitize(hackathon.rules) } : null;


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen w-full font-outfit bg-gray-50"
    >
      {/* Navbar */}
      <section className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Navbar />
        </div>
      </section>

      {/* Hero Section with Banner */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {hackathon.bannerImageUrl ? (
          <>
            <Image
              src={hackathon.bannerImageUrl}
              alt={`${hackathon.title} banner`}
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex flex-col justify-end p-6 md:p-10">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-4xl md:text-5xl font-poppins font-bold text-white mb-2"
              >
                {hackathon.title}
              </motion.h1>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col sm:flex-row sm:items-center gap-2 text-white text-sm"
              >
                <span className="flex items-center gap-1 font-outfit">
                  <IconCalendar size={16} />
                  {format(new Date(hackathon.startDate), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(hackathon.endDate), 'MMM dd, yyyy')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  hackathon.displayStatus.toLowerCase().includes('open')
                    ? 'bg-green-500/80 text-white'
                    : hackathon.displayStatus.toLowerCase().includes('closed')
                    ? 'bg-red-500/80 text-white'
                    : hackathon.displayStatus.toLowerCase().includes('reviewed')
                    ? 'bg-blue-500/80 text-white'
                    : 'bg-yellow-500/80 text-white'
                }`}>
                  {hackathon.displayStatus}
                </span>
              </motion.div>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-white/90 font-outfit text-lg mt-2"
              >
                Hosted by{' '}
                <Link href={`/profile/${hackathon.createdBy.username}`} className="text-yellow-300 hover:underline font-medium">
                  @{hackathon.createdBy.username}
                </Link>
                {hackathon.company && ` from ${hackathon.company.name}`}
              </motion.p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/70 to-yellow-500/70 flex flex-col justify-center p-6 md:p-10">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl md:text-5xl font-poppins font-bold text-gray-900 mb-2"
            >
              {hackathon.title}
            </motion.h1>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-900 text-sm"
            >
              <span className="flex items-center gap-1 font-outfit">
                <IconCalendar size={16} />
                {format(new Date(hackathon.startDate), 'MMM dd, yyyy')} -{' '}
                {format(new Date(hackathon.endDate), 'MMM dd, yyyy')}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                hackathon.displayStatus.toLowerCase().includes('open')
                  ? 'bg-green-500/80 text-white'
                  : hackathon.displayStatus.toLowerCase().includes('closed')
                  ? 'bg-red-500/80 text-white'
                  : hackathon.displayStatus.toLowerCase().includes('reviewed')
                  ? 'bg-blue-500/80 text-white'
                  : 'bg-yellow-500/80 text-white'
              }`}>
                {hackathon.displayStatus}
              </span>
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-gray-900 font-outfit text-lg mt-2"
            >
              Hosted by{' '}
              <Link href={`/profile/${hackathon.createdBy.username}`} className="text-yellow-700 hover:underline font-medium">
                @{hackathon.createdBy.username}
              </Link>
              {hackathon.company && ` from ${hackathon.company.name}`}
            </motion.p>
          </div>
        )}
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Action Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative bg-gradient-to-r from-black to-gray-800 rounded-2xl p-8 text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-circuit-pattern opacity-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <IconRocket size={32} className="text-yellow-300" />
              <h2 className="text-3xl font-poppins font-bold">Launch Your Journey</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {isStudent && (
                <>
                  {!hackathon.isRegistered && registrationOpen && (
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(252, 211, 77, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRegister}
                      disabled={registering}
                      className="bg-yellow-300/80 hover:bg-yellow-300/90 text-black font-outfit font-semibold py-3 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      {registering ? <IconLoader2 className="animate-spin" size={20} /> : 'Join Now'}
                    </motion.button>
                  )}
                  {hackathon.isRegistered && submissionOpen && !hackathon.hasSubmitted && (
                    <form onSubmit={handleSubmitProject} className="flex flex-col gap-4 w-full sm:w-auto">
                      <input
                        type="text"
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        placeholder="Enter project URL or text..."
                        className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300/70 font-outfit text-white transition-all duration-200"
                        required
                      />
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={submittingProject}
                        className="bg-white hover:bg-gray-200 text-black font-outfit font-semibold py-3 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                      >
                        {submittingProject ? <IconLoader2 className="animate-spin" size={20} /> : 'Submit Project'}
                      </motion.button>
                    </form>
                  )}
                  {hackathon.isRegistered && (hackathon.hasSubmitted || !submissionOpen) && (
                    <button
                      disabled
                      className="bg-gray-600 text-gray-400 font-outfit font-semibold py-3 px-8 rounded-full cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      {hackathon.hasSubmitted ? 'Project Submitted' : 'Registered'} <IconCheck size={20} />
                    </button>
                  )}
                </>
              )}
              {!isStudent && !isCreator && (
                <span className="bg-gray-600 text-gray-400 font-outfit font-semibold py-3 px-8 rounded-full cursor-default w-full sm:w-auto text-center">
                  {hackathon.displayStatus}
                </span>
              )}
              {isCreator && (
                <Link href={`/hackathons/${hackathon.id}/edit`}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(147, 197, 253, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-300/80 hover:bg-blue-300/90 text-black font-outfit font-semibold py-3 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    Edit Hackathon
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 font-outfit mt-4 text-center"
            >
              {error}
            </motion.p>
          )}
        </motion.section>

        {/* About & Rules Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100/50"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300/70 to-yellow-500/70 rounded-t-2xl" />
          <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-6 text-center">Hackathon Details</h2>
          <div className="flex flex-col  gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-poppins font-semibold text-gray-800 mb-4">About</h3>
              <div className="prose max-w-none text-gray-600 font-outfit leading-relaxed" dangerouslySetInnerHTML={sanitizedDescription} />
            </div>
            {sanitizedRules && (
              <div className="flex-1">
                <h3 className="text-xl font-poppins font-semibold text-gray-800 mb-4">Rules & Judging</h3>
                <div className="prose max-w-none text-gray-600 font-outfit leading-relaxed" dangerouslySetInnerHTML={sanitizedRules} />
              </div>
            )}
          </div>
        </motion.section>

        {/* Your Submission Section */}
        {isStudent && hackathon.isRegistered && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="relative bg-gradient-to-r from-yellow-300/10 to-yellow-500/10 rounded-2xl p-8 shadow-xl border border-yellow-300/30"
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
            <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-6">Your Submission</h2>
            {userSubmission ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold font-outfit ${
                    userSubmission.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-500/80 text-white'
                  }`}>
                    {userSubmission.status.replace('_', ' ')}
                  </span>
                  <p className="text-gray-500 text-sm font-outfit">
                    Submitted on {format(new Date(userSubmission.submittedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div className="space-y-6">
                  {userSubmission.submissionUrl && (
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3"
                    >
                      <IconLink size={24} className="text-blue-600" />
                      <a
                        href={userSubmission.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-outfit text-lg"
                      >
                        {userSubmission.submissionUrl}
                      </a>
                    </motion.div>
                  )}
                  {userSubmission.submissionText && (
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                      <p className="text-gray-800 font-medium font-outfit mb-2">Submission Text:</p>
                      <p className="text-gray-600 font-outfit whitespace-pre-wrap">{userSubmission.submissionText}</p>
                    </div>
                  )}
                  {(userSubmission.manualReviewScore !== null && userSubmission.manualReviewScore !== undefined) ? (
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3"
                    >
                      <IconStar size={24} className="text-yellow-500" />
                      <p className="text-gray-800 font-semibold font-outfit">
                        Manual Review Score: <span className="text-green-600">{userSubmission.manualReviewScore}/100</span>
                      </p>
                    </motion.div>
                  ) : (userSubmission.score !== null && userSubmission.score !== undefined) ? (
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3"
                    >
                      <IconStar size={24} className="text-yellow-500" />
                      <p className="text-gray-800 font-semibold font-outfit">
                        AI Review Score: <span className="text-green-600">{userSubmission.score}/100</span>
                      </p>
                    </motion.div>
                  ) : (
                    <p className="text-gray-600 font-outfit">Awaiting review...</p>
                  )}
                  {userSubmission.feedback && (
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                      <p className="text-gray-800 font-medium font-outfit mb-2">Feedback:</p>
                      <p className="text-gray-600 font-outfit">{userSubmission.feedback}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    disabled
                    className="bg-green-500/80 text-white font-outfit font-semibold py-2 px-6 rounded-full flex items-center gap-2"
                  >
                    Submission Complete <IconCheck size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-600 font-outfit text-lg">You’re registered! Time to submit your epic project.</p>
                {submissionOpen && (
                  <form onSubmit={handleSubmitProject} className="space-y-4">
                    <input
                      type="text"
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="Drop your project URL or text..."
                      className="w-full p-4 bg-gray-100/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300/70 font-outfit text-gray-900 transition-all duration-200"
                      required
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={submittingProject}
                      className="bg-black hover:bg-gray-800 text-white font-outfit font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      {submittingProject ? <IconLoader2 className="animate-spin" size={20} /> : 'Submit Project'}
                    </motion.button>
                  </form>
                )}
              </div>
            )}
          </motion.section>
        )}

        {/* Key Dates Section - Timeline Style */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="relative"
        >
          <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-8 text-center">Key Dates</h2>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-4 top-0 h-full w-1 bg-yellow-300/70" />
            <ul className="space-y-8">
              {[
                { label: 'Hackathon Start', date: hackathon.startDate },
                { label: 'Hackathon End', date: hackathon.endDate },
                { label: 'Registration Closes', date: hackathon.registrationEndDate },
                { label: 'Submissions Close', date: hackathon.submissionEndDate },
              ].map((event, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-300/70 rounded-full flex items-center justify-center z-10">
                    <IconCalendar size={16} className="text-white" />
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 flex-1">
                    <p className="text-gray-800 font-semibold font-outfit">{event.label}</p>
                    <p className="text-gray-600 font-outfit">{format(new Date(event.date), 'PPP p')}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Prizes Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="relative bg-gradient-to-r from-yellow-300/20 to-yellow-500/20 rounded-2xl p-8 shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-circuit-pattern opacity-15 pointer-events-none" />
          <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-8 text-center">Prizes Await!</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)' }}
                className="relative bg-white rounded-lg p-6 shadow-md border border-yellow-300/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-300/20 rounded-bl-full" />
                <div className="flex items-center gap-4">
                  <IconTrophy size={40} className="text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-poppins font-semibold text-gray-800">Prize #{index + 1}</h3>
                    <p className="text-gray-600 font-outfit">Coming soon – stay tuned for epic rewards!</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      <Footer />
    </motion.div>
  );
}
