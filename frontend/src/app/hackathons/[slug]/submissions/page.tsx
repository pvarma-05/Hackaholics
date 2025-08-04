
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconLoader2, IconUser, IconLink, IconFileText, IconStar } from '@tabler/icons-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';

interface Submission {
    id: string;
    submitterId: string;
    submitterUsername: string;
    submitterName: string;
    submitterProfileImageUrl: string;
    submissionUrl?: string;
    submissionText?: string;
    score?: number;
    feedback?: string;
    status: string;
    submittedAt: string;
    hackathonSubmissionEndDate: string; 
}

export default function HackathonSubmissionsPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [hackathonTitle, setHackathonTitle] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!slug) return;

            setLoading(true);
            setError(null);
            try {
                const token = isSignedIn ? await getToken() : undefined;
                if (!token) {
                    setError('Authentication required to view this page.');
                    router.push('/login');
                    return;
                }

                
                const hackathonResponse = await axios.get<any>(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${slug}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const hackathonId = hackathonResponse.data.id;
                setHackathonTitle(hackathonResponse.data.title);

                
                const isCreator = user?.id === hackathonResponse.data.createdBy.id;
                const isExpert = user?.publicMetadata?.role === 'EXPERT';
                const isCompanyExpert = isExpert && user?.publicMetadata?.companyId === hackathonResponse.data.companyId && hackathonResponse.data.companyId;
                const isAdmin = user?.publicMetadata?.role === 'ADMIN';

                if (!isCreator && !isAdmin && !isCompanyExpert) {
                    setError('Unauthorized to view submissions for this hackathon.');
                    setLoading(false);
                    return;
                }

                
                const response = await axios.get<Submission[]>(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${hackathonId}/submissions`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSubmissions(response.data);

            } catch (err: any) {
                console.error('Failed to fetch submissions:', err);
                setError(err.response?.data?.error || 'Failed to load submissions.');
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded && isSignedIn && user && slug) {
            fetchSubmissions();
        } else if (isLoaded && !isSignedIn) {
            setError('Please log in to view this page.');
            router.push('/login');
        }
    }, [slug, isLoaded, isSignedIn, user, getToken, router]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
                <p className="ml-2 font-outfit text-gray-700">Loading submissions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <p className="text-red-500 text-lg font-outfit mb-4">{error}</p>
                <Link href={`/hackathons/${slug}`} className="text-yellow-300/70 hover:underline font-medium">
                    Back to Hackathon
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
            <section className="flex px-4 sm:px-10 md:px-20 mt-5 mb-4">
                <Navbar />
            </section>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-poppins font-semibold text-gray-900">
                        Submissions for "{hackathonTitle}"
                    </h1>
                    <Link href={`/hackathons/${slug}`}>
                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200">
                            Back to Hackathon
                        </button>
                    </Link>
                </div>

                {submissions.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-600 text-lg">No submissions yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Submitter
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
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Submitted At
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {submissions.map((submission) => {
                                    const submissionDeadlinePassed = new Date() > new Date(submission.hackathonSubmissionEndDate);
                                    return (
                                        <tr key={submission.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <Link href={`/profile/${submission.submitterUsername}`}>
                                                            <img className="h-10 w-10 rounded-full object-cover" src={submission.submitterProfileImageUrl || '/default-avatar.png'} alt="" />
                                                        </Link>
                                                    </div>
                                                    <div className="ml-4">
                                                        <Link href={`/profile/${submission.submitterUsername}`}>
                                                            <div className="text-sm font-medium text-gray-900 hover:underline">{submission.submitterName}</div>
                                                            <div className="text-sm text-gray-500">@{submission.submitterUsername}</div>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {submission.submissionUrl ? (
                                                    <a href={submission.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                                        <IconLink size={16} /> Link
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-700 text-sm max-w-xs truncate block">{submission.submissionText}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    submission.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {submission.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {submission.score !== null && submission.score !== undefined ? submission.score : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {submissionDeadlinePassed && submission.status !== 'REVIEWED_MANUAL' && submission.status !== 'REVIEWED_AI' ? (
                                                    <Link href={`/hackathons/${slug}/submissions/${submission.id}/review`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1">
                                                        Review <IconStar size={16} />
                                                    </Link>
                                                ) : submission.status === 'REVIEWED_MANUAL' || submission.status === 'REVIEWED_AI' ? (
                                                    <span className="text-gray-500">Reviewed</span>
                                                ) : (
                                                    <span className="text-gray-500">Pending Review</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
            <Footer />
        </motion.div>
    );
}
