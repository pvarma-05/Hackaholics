'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { IconLoader2 } from '@tabler/icons-react';
import { CreateOrEditHackathonForm } from '@/components/forms/CreateOrEditHackathonForm';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { format } from 'date-fns';

import { HackathonFormData, HackathonReviewType } from '../../../../../schemas/hackathonSchema';


export default function EditHackathonPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();

    const [initialData, setInitialData] = useState<HackathonFormData | null>(null);
    const [hackathonId, setHackathonId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHackathonData = async () => {
            if (!slug) return;

            setLoading(true);
            setError(null);
            try {
                const token = isSignedIn ? await getToken() : undefined;
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const response = await axios.get<any>(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${slug}`,
                    { headers }
                );

                const hackathonData = response.data;
                setHackathonId(hackathonData.id);
                setInitialData({
                    title: hackathonData.title,
                    description: hackathonData.description,
                    rules: hackathonData.rules,
                    bannerImageUrl: hackathonData.bannerImageUrl,
                    startDate: format(new Date(hackathonData.startDate), 'yyyy-MM-dd'),
                    endDate: format(new Date(hackathonData.endDate), 'yyyy-MM-dd'),
                    registrationEndDate: format(new Date(hackathonData.registrationEndDate), 'yyyy-MM-dd'),
                    submissionEndDate: format(new Date(hackathonData.submissionEndDate), 'yyyy-MM-dd'),
                    reviewType: hackathonData.reviewType,
                    companyId: hackathonData.company?.id || null,
                });

            } catch (err: any) {
                console.error('Failed to fetch hackathon data for editing:', err);
                setError(err.response?.data?.error || 'Failed to load hackathon for editing.');
            } finally {
                setLoading(false);
            }
        };

        fetchHackathonData();
    }, [slug, isSignedIn, getToken]);


    useEffect(() => {
        if (isLoaded && (!user || user.publicMetadata?.role !== 'EXPERT')) {
            router.push('/');
        }
    }, [isLoaded, user, router]);


    if (loading || !isLoaded || (isLoaded && user && user.publicMetadata?.role !== 'EXPERT')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
                <p className="ml-2 font-outfit text-gray-700">Loading hackathon for editing...</p>
            </div>
        );
    }

    if (error || !initialData || !hackathonId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <p className="text-red-500 text-lg font-outfit mb-4">{error || 'Could not load hackathon for editing.'}</p>
                <Link href="/dashboard/expert" className="text-yellow-300/70 hover:underline font-medium">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <section className="flex px-4 sm:px-10 md:px-20 mt-5 mb-4">
                <Navbar />
            </section>
            <div className="max-w-2xl mx-auto px-4">
                <CreateOrEditHackathonForm initialData={initialData} hackathonId={hackathonId} />
            </div>
            <Footer />
        </div>
    );
}
