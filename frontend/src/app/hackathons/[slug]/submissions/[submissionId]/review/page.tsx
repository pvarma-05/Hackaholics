'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconLoader2, IconUser, IconLink, IconFileText, IconArrowLeft } from '@tabler/icons-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

const reviewSchema = z.object({
  score: z.number().min(0, "Score must be at least 0").max(100, "Score cannot exceed 100"),
  feedback: z.string().max(1000, "Feedback cannot exceed 1000 characters").optional(),
});
type ReviewFormData = z.infer<typeof reviewSchema>;

interface SubmissionDetail {
  id: string;
  submitterId: string;
  submitterUsername: string;
  submitterName: string;
  submitterProfileImageUrl: string;
  submissionUrl?: string;
  submissionText?: string;
  score?: number;
  manualReviewScore?: number;
  feedback?: string;
  status: string;
  submittedAt: string;
  hackathonId: string;
  hackathonSubmissionEndDate: string;
}

export default function ReviewSubmissionPage() {
  const { slug, submissionId } = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [hackathonTitle, setHackathonTitle] = useState<string>('');
  const [hackathonId, setHackathonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      score: 0,
      feedback: '',
    }
  });

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!slug || !submissionId) return;

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
        const fetchedHackathonId = hackathonResponse.data.id;
        setHackathonId(fetchedHackathonId);
        setHackathonTitle(hackathonResponse.data.title);

        const isCreator = user?.id === hackathonResponse.data.createdBy.clerkId;
        const isExpert = user?.publicMetadata?.role === 'EXPERT';
        const isCompanyExpert = isExpert && user?.publicMetadata?.companyId === hackathonResponse.data.companyId && hackathonResponse.data.companyId;
        const isAdmin = user?.publicMetadata?.role === 'ADMIN';

        console.log('Frontend DEBUG (Submissions Page): Authorization Check');
        console.log(`  user.id (Clerk ID): "${user?.id}"`);
        console.log(`  hackathonResponse.data.createdBy.clerkId: "${hackathonResponse.data.createdBy.clerkId}"`);
        console.log(`  isCreator: ${isCreator}`);
        console.log(`  isExpert: ${isExpert}`);
        console.log(`  user.publicMetadata.companyId: "${user?.publicMetadata?.companyId}"`);
        console.log(`  hackathonResponse.data.companyId: "${hackathonResponse.data.companyId}"`);
        console.log(`  isCompanyExpert: ${isCompanyExpert}`);
        console.log(`  isAdmin: ${isAdmin}`);
        console.log(`  Overall Check (!isCreator && !isAdmin && !isCompanyExpert): ${!isCreator && !isAdmin && !isCompanyExpert}`);

        if (!isCreator && !isAdmin && !isCompanyExpert) {
          setError('Unauthorized to review submissions for this hackathon.');
          setLoading(false);
          return;
        }


        const submissionsResponse = await axios.get<SubmissionDetail[]>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${fetchedHackathonId}/submissions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const foundSubmission = submissionsResponse.data.find(sub => sub.id === submissionId);

        if (!foundSubmission) {
          setError('Submission not found.');
          setLoading(false);
          return;
        }
        setSubmission(foundSubmission);

        if (foundSubmission.manualReviewScore !== null && foundSubmission.manualReviewScore !== undefined) {
          reset({ score: foundSubmission.manualReviewScore, feedback: foundSubmission.feedback || '' });
        }
      } catch (err: any) {
        console.error('Failed to fetch submission details for review:', err);
        setError(err.response?.data?.error || 'Failed to load submission details.');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn && user && slug && submissionId) {
      fetchSubmissionDetails();
    } else if (isLoaded && !isSignedIn) {
      setError('Please log in to view this page.');
      router.push('/login');
    }
  }, [slug, submissionId, isLoaded, isSignedIn, user, getToken, router, reset]);

  const onSubmitReview = async (data: ReviewFormData) => {
    if (!submission) {
      setError('No submission data available.');
      return;
    }
    setSubmittingReview(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${submission.id}/review`,
        { score: Number(data.score), feedback: data.feedback || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Submission reviewed:', response.data);

      setSubmission(response.data);
      toast.success('Review submitted successfully!');
      router.push(`/hackathons/${slug}/analytics`);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      console.error('Response data:', err.response?.data);
      const errorMessage = err.response?.data?.error || 'Failed to submit review. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
        <p className="ml-2 font-outfit text-gray-700">Loading submission...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-500 text-lg font-outfit mb-4">{error}</p>
        <Link href={`/hackathons/${hackathonId}/analytics`} className="text-yellow-300/70 hover:underline font-medium">
          Back to Analytics
        </Link>
      </div>
    );
  }

  const submissionDeadlinePassed = new Date() > new Date(submission!.hackathonSubmissionEndDate);
  const hasBeenReviewed = submission?.status === 'REVIEWED_MANUAL' || submission?.status === 'REVIEWED_AI';

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Link href={`/hackathons/${slug}/analytics`} className="flex items-center text-gray-700 hover:text-gray-900 gap-2 mb-6">
          <IconArrowLeft size={20} /> Back to Analytics
        </Link>

        <h1 className="text-3xl font-poppins font-semibold text-gray-900 mb-4">
          Review Submission from "{submission!.submitterName}" for "{hackathonTitle}"
        </h1>

        {/* Submission Details */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="flex items-center gap-4">
            <Link href={`/profile/${submission!.submitterUsername}`}>
              <img className="h-16 w-16 rounded-full object-cover border-2 border-yellow-400" src={submission!.submitterProfileImageUrl || '/default-avatar.png'} alt={submission!.submitterName} />
            </Link>
            <div>
              <Link href={`/profile/${submission!.submitterUsername}`}>
                <h3 className="text-xl font-semibold text-gray-900 hover:underline">
                  {submission!.submitterName} (@{submission!.submitterUsername})
                </h3>
              </Link>
              <p className="text-sm text-gray-500">Submitted on {format(new Date(submission!.submittedAt), 'PPP p')}</p>
            </div>
          </div>
          <hr className="border-gray-200" />
          {submission!.submissionUrl ? (
            <p className="text-gray-700 flex items-center gap-2">
              <span className="font-semibold">Project Link:</span>{' '}
              <a href={submission!.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                {submission!.submissionUrl} <IconLink size={16} />
              </a>
            </p>
          ) : (
            <p className="text-gray-700">
              <span className="font-semibold">Project Text:</span>{' '}
              <div className="mt-2 p-3 bg-gray-100 rounded-md whitespace-pre-wrap">{submission!.submissionText}</div>
            </p>
          )}
          {submission?.score !== null && submission?.score !== undefined && (
            <p className="text-gray-700 font-semibold">AI Score: <span className="text-yellow-600">{submission.score}</span></p>
          )}
          {submission?.feedback && (
            <p className="text-gray-700 font-semibold">AI Feedback: <span className="font-normal">{submission.feedback}</span></p>
          )}
        </div>

        {/* Review Form */}
        <h2 className="text-2xl font-poppins font-semibold text-gray-900 mt-8 mb-4">
          {hasBeenReviewed ? 'Update Review' : 'Submit Review'}
        </h2>
        {!submissionDeadlinePassed && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
            Submissions can only be reviewed after the submission deadline has passed.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-6">
          <div>
            <label htmlFor="score" className="block text-sm font-semibold text-gray-700 mb-1">
              Score (0-100)
            </label>
            <input
              id="score"
              type="number"
              {...register('score', { valueAsNumber: true })}
              min={0} max={100}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              disabled={submittingReview || !submissionDeadlinePassed}
            />
            {errors.score && (
              <p className="text-red-500 text-sm mt-1">{errors.score.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="feedback" className="block text-sm font-semibold text-gray-700 mb-1">
              Feedback (Optional)
            </label>
            <textarea
              id="feedback"
              rows={5}
              {...register('feedback')}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              placeholder="Provide constructive feedback for the submission..."
              disabled={submittingReview || !submissionDeadlinePassed}
            />
            {errors.feedback && (
              <p className="text-red-500 text-sm mt-1">{errors.feedback.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submittingReview || !submissionDeadlinePassed}
            className={`w-full p-3 rounded-lg font-outfit font-semibold text-black flex items-center justify-center gap-2
                                    ${(submittingReview || !submissionDeadlinePassed)
                ? 'bg-yellow-300/30 cursor-not-allowed'
                : 'bg-yellow-300/70 hover:bg-yellow-300/60'
              } transition-colors duration-200`}
          >
            {submittingReview ? (
              <>
                <IconLoader2 className="animate-spin h-5 w-5" />
                Submitting Review...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </form>
      </main>
      <Footer />
    </motion.div>
  );
}
