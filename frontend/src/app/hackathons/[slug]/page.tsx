'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconLoader2, IconCalendar, IconBuildingCommunity, IconUserScan, IconCheck, IconX } from '@tabler/icons-react';
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
  feedback?: string;
  status: string;
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
      const payload = submissionContent.startsWith('http://') || submissionContent.startsWith('https://') ?
                      { submissionUrl: submissionContent.trim() } :
                      { submissionText: submissionContent.trim() };
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-500 text-lg font-outfit mb-4">{error || 'Hackathon not found'}</p>
        <Link href="/hackathons" className="text-yellow-300/70 hover:underline font-medium">
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full font-outfit bg-gray-50"
    >
      {/* Navbar */}
      <section className="flex px-4 sm:px-10 md:px-20 mt-5 mb-4">
        <Navbar />
      </section>

      {/* Banner - Title is now placed below */}
      {hackathon.bannerImageUrl && (
        <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
          <Image
            src={hackathon.bannerImageUrl}
            alt={`${hackathon.title} banner`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Header / Meta Info - Title is now ALWAYS here below the banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-poppins font-bold text-gray-900 mb-2">
                {hackathon.title}
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              Hosted by{' '}
              <Link href={`/profile/${hackathon.createdBy.username}`} className="text-yellow-700 hover:underline font-medium">
                @{hackathon.createdBy.username}
              </Link>
              {hackathon.company && ` from ${hackathon.company.name}`}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span className="flex items-center gap-1">
                <IconCalendar size={16} />
                {format(new Date(hackathon.startDate), 'MMM dd, yyyy')} -{' '}
                {format(new Date(hackathon.endDate), 'MMM dd, yyyy')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                hackathon.displayStatus.toLowerCase().includes('open') ? 'bg-green-100 text-green-800 border-green-300' :
                hackathon.displayStatus.toLowerCase().includes('closed') ? 'bg-red-100 text-red-800 border-red-300' :
                'bg-yellow-100 text-yellow-800 border-yellow-300'
              }`}>
                {hackathon.displayStatus}
              </span>
            </div>
          </div>

          {/* Action Buttons for Students / Creator */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isStudent && (
              <>
                {/* Scenario 1: Student is NOT registered AND Registration is OPEN */}
                {!hackathon.isRegistered && registrationOpen && (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="bg-yellow-300/70 hover:bg-yellow-300/60 text-black font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {registering ? <IconLoader2 className="animate-spin" size={20} /> : 'Register Now'}
                  </button>
                )}

                {/* Scenario 2: Student IS registered */}
                {hackathon.isRegistered && (
                  <>
                    {/* Sub-scenario 2.1: Registered, Submission is OPEN, NOT Submitted Yet */}
                    {submissionOpen && !hackathon.hasSubmitted ? (
                      <form onSubmit={handleSubmitProject} className="flex flex-col gap-3 w-full sm:w-auto">
                        <input
                          type="text"
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          placeholder="Submit project URL or text..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                          required
                        />
                        <button
                          type="submit"
                          disabled={submittingProject}
                          className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          {submittingProject ? <IconLoader2 className="animate-spin" size={20} /> : 'Submit Project'}
                        </button>
                      </form>
                    ) : (
                      /* Sub-scenario 2.2: Registered, but either Submission is CLOSED OR Already Submitted */
                      /* This covers: Registered & Reg. Closed; Registered & Sub. Closed; Registered & Sub. Open but already Submitted */
                      <button
                        disabled
                        className="bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-1 w-full sm:w-auto"
                      >
                        {hackathon.hasSubmitted ? 'Project Submitted' : 'Registered'} <IconCheck size={20} className="ml-1" />
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* Non-student and Non-creator specific status display */}
            {/* Show general status if not a student, or if student but not involved in current action states */}
            {!isStudent && !isCreator && (
                <span className="bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg cursor-default w-full sm:w-auto text-center">
                    {hackathon.displayStatus}
                </span>
            )}
            {/* Creator's Edit Button */}
            {isCreator && (
                <Link href={`/hackathons/${hackathon.id}/edit`}>
                    <button className="bg-blue-300/70 hover:bg-blue-300/60 text-black font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto">
                        Edit Hackathon
                    </button>
                </Link>
            )}
          </div>
        </div>

        {/* Description */}
        <section className="space-y-4">
          <h2 className="text-2xl font-poppins font-semibold text-gray-900">About This Hackathon</h2>
          <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={sanitizedDescription} />
        </section>

        {/* Rules */}
        {sanitizedRules && (
          <section className="space-y-4">
            <h2 className="text-2xl font-poppins font-semibold text-gray-900">Rules & Judging</h2>
            <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={sanitizedRules} />
          </section>
        )}

        {/* User's Submission Status */}
        {isStudent && hackathon.isRegistered && (
            <section className="space-y-4">
                <h2 className="text-2xl font-poppins font-semibold text-gray-900">Your Submission</h2>
                {userSubmission ? (
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
                        <p className="text-gray-700 font-medium">Status: <span className={`font-semibold ${userSubmission.status === 'PENDING_REVIEW' ? 'text-yellow-600' : 'text-green-600'}`}>{userSubmission.status.replace('_', ' ')}</span></p>
                        {userSubmission.submissionUrl && <p className="text-gray-700">Link: <a href={userSubmission.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{userSubmission.submissionUrl}</a></p>}
                        {userSubmission.submissionText && <p className="text-gray-700">Text: {userSubmission.submissionText}</p>}
                        {userSubmission.score !== null && userSubmission.score !== undefined && <p className="text-gray-700">Score: {userSubmission.score}</p>}
                        {userSubmission.feedback && <p className="text-gray-700">Feedback: {userSubmission.feedback}</p>}
                    </div>
                ) : (
                    <p className="text-gray-600">You are registered, but have not submitted your project yet.</p>
                )}
            </section>
        )}


        {/* Placeholder Sections */}
        <section>
          <h2 className="text-2xl font-poppins font-semibold text-gray-900">Key Dates</h2>
          <ul className="space-y-2 text-gray-700">
            <li><span className="font-semibold">Hackathon Start:</span> {format(new Date(hackathon.startDate), 'PPP p')}</li>
            <li><span className="font-semibold">Hackathon End:</span> {format(new Date(hackathon.endDate), 'PPP p')}</li>
            <li><span className="font-semibold">Registration Closes:</span> {format(new Date(hackathon.registrationEndDate), 'PPP p')}</li>
            <li><span className="font-semibold">Submissions Close:</span> {format(new Date(hackathon.submissionEndDate), 'PPP p')}</li>
          </ul>
        </section>

        {/* Additional Sections (e.g., Prizes, Judging, FAQ) */}
        <section>
          <h2 className="text-2xl font-poppins font-semibold text-gray-900">Prizes</h2>
          <p className="text-gray-600">Prizes coming soon...</p>
        </section>
      </main>
      <Footer />
    </motion.div>
  );
}
