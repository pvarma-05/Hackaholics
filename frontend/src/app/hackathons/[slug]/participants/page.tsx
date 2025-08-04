'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { motion } from 'framer-motion';
import { IconLoader2, IconUser, IconMapPin, IconCode, IconBuildingCommunity } from '@tabler/icons-react';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';

interface Participant {
    id: string;
    username: string;
    name: string;
    profileImageUrl: string;
    role: 'STUDENT' | 'EXPERT';
    registeredAt: string;
    details: {
        specialty?: string;
        skills?: string[];
        location?: string;
        companyName?: string;
    };
}

export default function HackathonParticipantsPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [hackathonTitle, setHackathonTitle] = useState<string>(''); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchParticipants = async () => {
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
                    setError('Unauthorized to view participants for this hackathon.');
                    setLoading(false);
                    return;
                }

                
                const response = await axios.get<Participant[]>(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons/${hackathonId}/participants`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setParticipants(response.data);

            } catch (err: any) {
                console.error('Failed to fetch participants:', err);
                setError(err.response?.data?.error || 'Failed to load participants.');
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded && isSignedIn && user && slug) { 
            fetchParticipants();
        } else if (isLoaded && !isSignedIn) {
            setError('Please log in to view this page.');
            router.push('/login');
        }
    }, [slug, isLoaded, isSignedIn, user, getToken, router]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
                <p className="ml-2 font-outfit text-gray-700">Loading participants...</p>
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
                        Participants for "{hackathonTitle}"
                    </h1>
                    <Link href={`/hackathons/${slug}`}>
                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200">
                            Back to Hackathon
                        </button>
                    </Link>
                </div>

                {participants.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-600 text-lg">No participants registered yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {participants.map((participant) => (
                            <div key={participant.id} className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
                                <Link href={`/profile/${participant.username}`}>
                                    <img
                                        src={participant.profileImageUrl || '/default-avatar.png'}
                                        alt={participant.name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
                                    />
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/profile/${participant.username}`}>
                                        <h3 className="text-lg font-semibold text-gray-900 hover:underline">
                                            {participant.name} (@{participant.username})
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-600 capitalize">{participant.role.toLowerCase()}</p>
                                    {participant.details.specialty && (
                                        <p className="text-sm text-gray-700 flex items-center gap-1">
                                            <IconCode size={14} /> {participant.details.specialty.replaceAll('_', ' ')}
                                        </p>
                                    )}
                                    {participant.details.location && participant.role === 'STUDENT' && (
                                        <p className="text-sm text-gray-700 flex items-center gap-1">
                                            <IconMapPin size={14} /> {participant.details.location}
                                        </p>
                                    )}
                                    {participant.details.companyName && participant.role === 'EXPERT' && (
                                        <p className="text-sm text-gray-700 flex items-center gap-1">
                                            <IconBuildingCommunity size={14} /> {participant.details.companyName}
                                        </p>
                                    )}
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
