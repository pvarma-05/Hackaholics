'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconLoader2, IconUser, IconLink, IconFileText, IconStar, IconArrowLeft, IconUsers, IconSend } from '@tabler/icons-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

interface ParticipantSubmissionData {
  id: string;
  userId: string;
  username: string;
  name: string;
  profileImageUrl: string;
  role: 'STUDENT' | 'EXPERT';
  registeredAt: string;
  isSubmitted: boolean;
  submissionId?: string;
  submissionStatus?: string;
  submissionScore?: number;
  submissionFeedback?: string;
  submissionUrl?: string;
  submissionText?: string;
  submittedAt?: string;
  participantDetails?: {
    specialty?: string;
    skills?: string[];
    location?: string;
    schoolName?: string;
    companyName?: string;
  };
}

interface HackathonAnalyticsData {
  hackathon: {
    id: string;
    title: string;
    slug: string;
    submissionEndDate: string;
    reviewType: string;
  };
  registeredCount: number;
  submittedCount: number;
  participantsAndSubmissions: ParticipantSubmissionData[];
}

interface BasicHackathonInfo {
  id: string;
  title: string;
  slug: string;
  createdBy: { id: string; clerkId: string };
  companyId?: string | null;
}

export default function HackathonAnalyticsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [analyticsData, setAnalyticsData] = useState<HackathonAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hackathonTitleForDisplay, setHackathonTitleForDisplay] = useState<string>('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!slug) {
        setError('Hackathon slug is missing.');
        setLoading(false);
        return;
      }

      if (!isLoaded || !isSignedIn || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const basicHackathonApiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${slug}`;
        const basicHackathonResponse = await axios.get<BasicHackathonInfo>(
          basicHackathonApiUrl,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const fetchedHackathonId = basicHackathonResponse.data.id;
        const fetchedHackathonTitle = basicHackathonResponse.data.title;
        setHackathonTitleForDisplay(fetchedHackathonTitle);

        const creatorClerkId = basicHackathonResponse.data.createdBy.clerkId;
        const currentUserClerkId = user.id;

        const isCreator = currentUserClerkId === creatorClerkId;
        const isExpert = user.publicMetadata?.role === 'EXPERT';
        const isAdmin = user.publicMetadata?.role === 'ADMIN';

        let isCompanyExpert = false;
        const hackathonCompanyId = basicHackathonResponse.data.companyId;
        const userPublicMetadataCompanyId = user.publicMetadata?.companyId;

        if (isExpert && hackathonCompanyId && userPublicMetadataCompanyId) {
          isCompanyExpert = userPublicMetadataCompanyId === hackathonCompanyId;
        }

        if (!isCreator && !isAdmin && !isCompanyExpert) {
          setError('Unauthorized to view analytics for this hackathon.');
          setLoading(false);
          return;
        }

        const analyticsApiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${fetchedHackathonId}/analytics`;
        const response = await axios.get<HackathonAnalyticsData>(
          analyticsApiUrl,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalyticsData(response.data);
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        const errorMessage = err.response?.data?.error || 'Failed to load analytics. Check network and backend logs.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      if (isSignedIn && user) {
        fetchAnalytics();
      } else {
        router.push('/login');
      }
    }
  }, [slug, isLoaded, isSignedIn, user, getToken, router]);

  if (loading || (!analyticsData && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
        <p className="ml-2 font-outfit text-gray-700">Loading analytics...</p>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-500 text-lg font-outfit mb-4">{error || 'Could not load hackathon analytics.'}</p>
        <Link href={`/dashboard/expert`} className="text-yellow-300/70 hover:underline font-medium">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const hackathon = analyticsData.hackathon;
  const submissionDeadlinePassed = new Date() > new Date(hackathon.submissionEndDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full font-outfit bg-gray-50"
    >
      <Toaster position="top-right" />
      <section className="flex px-4 sm:px-10 md:px-20 mt-5 mb-4">
        <Navbar />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl md:text-4xl font-poppins font-semibold text-gray-900">
            Analytics for "{hackathonTitleForDisplay}"
          </h1>
          <Link href={`/dashboard/expert`}>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200">
              <IconArrowLeft size={20} className="inline-block mr-1" /> Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Registered Participants</p>
              <p className="text-4xl font-poppins font-bold text-gray-900">{analyticsData.registeredCount}</p>
            </div>
            <IconUsers size={48} className="text-yellow-500/70" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Project Submissions</p>
              <p className="text-4xl font-poppins font-bold text-gray-900">{analyticsData.submittedCount}</p>
            </div>
            <IconFileText size={48} className="text-blue-500/70" />
          </div>
        </div>

        {/* Participants and Submissions Table */}
        <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">Participants & Submissions</h2>
        {analyticsData.participantsAndSubmissions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">No participants registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.participantsAndSubmissions.map((data) => (
                  <tr key={data.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Link href={`/profile/${data.username}`}>
                            <img className="h-10 w-10 rounded-full object-cover" src={data.profileImageUrl || '/default-avatar.png'} alt="" />
                          </Link>
                        </div>
                        <div className="ml-4">
                          <Link href={`/profile/${data.username}`}>
                            <div className="text-sm font-medium text-gray-900 hover:underline">{data.name}</div>
                            <div className="text-sm text-gray-500">@{data.username}</div>
                          </Link>
                          {data.participantDetails?.schoolName && data.role === 'STUDENT' && (
                            <div className="text-xs text-gray-500">{data.participantDetails.schoolName}</div>
                          )}
                          {data.participantDetails?.companyName && data.role === 'EXPERT' && (
                            <div className="text-xs text-gray-500">{data.participantDetails.companyName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(data.registeredAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {data.isSubmitted ? (
                        data.submissionUrl ? (
                          <a href={data.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                            <IconLink size={16} /> Link
                          </a>
                        ) : (
                          <span className="text-gray-700 text-sm max-w-xs truncate block">{data.submissionText}</span>
                        )
                      ) : (
                        <span className="text-gray-500 text-sm">Not Submitted</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${data.submissionStatus === 'PENDING REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                        data.submissionStatus === 'REVIEWED MANUAL' || data.submissionStatus === 'REVIEWED AI' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {data.submissionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.submissionScore !== null && data.submissionScore !== undefined ? data.submissionScore : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {data.isSubmitted && submissionDeadlinePassed && hackathon.reviewType === 'MANUAL' && data.submissionStatus === 'PENDING REVIEW' ? (
                        <Link href={`/hackathons/${hackathon.slug}/submissions/${data.submissionId}/review`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1">
                          Review <IconStar size={16} />
                        </Link>
                      ) : data.isSubmitted && data.submissionStatus === 'REVIEWED MANUAL' ? (
                        <span className="text-gray-500">Reviewed</span>
                      ) : data.isSubmitted && data.submissionStatus === 'REVIEWED AI' ? (
                        <span className="text-gray-500">AI Reviewed</span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </motion.div>
  );
}
