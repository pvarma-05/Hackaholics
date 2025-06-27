'use client';

import { useState, useEffect } from 'react';
import { useUser, RedirectToSignIn } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { IconLoader2, IconUser, IconSettings, IconLock } from '@tabler/icons-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

interface Profile {
  clerkId: string;
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
  timezone?: string | null;
  occupation?: string | null;
  studentLevel?: string | null;
  schoolName?: string | null;
  graduationMonth?: string | null;
  graduationYear?: number | null;
  birthMonth?: number | null;
  birthYear?: number | null;
  company?: { id: string; name: string } | null;
  isApprovedInCompany?: boolean;
}

interface Company {
  id: string;
  name: string;
}

interface Errors {
  profileInfo: { [key: string]: string };
  studentPrefs: { [key: string]: string };
  expertPrefs: { [key: string]: string };
  account: { [key: string]: string };
}

export default function SettingsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    profileInfo: { name: '', profileImage: null as File | null, githubUrl: '', linkedinUrl: '', twitterUrl: '', bio: '' },
    studentPrefs: {
      specialty: '', skills: [] as string[], interests: [] as string[], location: '', timezone: '',
      occupation: '', studentLevel: '', schoolName: '', graduationMonth: '', graduationYear: '', birthMonth: '', birthYear: '',
    },
    expertPrefs: { specialty: '', skills: [] as string[], interests: [] as string[], companyId: '' },
    account: { username: '', email: '' },
  });
  const [errors, setErrors] = useState<Errors>({ profileInfo: {}, studentPrefs: {}, expertPrefs: {}, account: {} });
  const [isSubmitting, setIsSubmitting] = useState({ profileInfo: false, studentPrefs: false, expertPrefs: false, account: false });

  const specialties = ['FULL_STACK', 'FRONTEND', 'BACKEND', 'MOBILE', 'DATA_SCIENCE', 'DESIGNER', 'PRODUCT_MANAGER', 'BUSINESS', 'OTHER'];
  const interests = [
    'AR_VR', 'BEGINNER_FRIENDLY', 'BLOCKCHAIN', 'COMMUNICATION', 'CYBERSECURITY', 'DATABASES', 'DESIGN', 'DEVOPS',
    'ECOMMERCE', 'EDUCATION', 'ENTERPRISE', 'FINTECH', 'GAMING', 'HEALTH', 'IOT', 'LIFEHACKS', 'NO_CODE',
    'MACHINE_LEARNING', 'MOBILE', 'MUSIC_ART', 'OPEN_ENDED', 'PRODUCTIVITY', 'QUANTUM', 'RPA', 'SERVERLESS', 'SOCIAL_GOOD', 'VOICE_SKILLS', 'WEB',
  ];
  const occupations = ['STUDENT', 'PROFESSIONAL'];
  const studentLevels = ['COLLEGE', 'HIGH_SCHOOL', 'MIDDLE_SCHOOL'];
  const graduationMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:4000/api/profile/${user.username}`);
        const profileData = response.data;
        setProfile(profileData);
        setPreviewImage(profileData.profileImageUrl || user.imageUrl || '/default-avatar.png');
        setFormData({
          profileInfo: {
            name: profileData.name || '',
            profileImage: null,
            githubUrl: profileData.githubUrl || '',
            linkedinUrl: profileData.linkedinUrl || '',
            twitterUrl: profileData.twitterUrl || '',
            bio: profileData.bio || '',
          },
          studentPrefs: {
            specialty: profileData.specialty || '',
            skills: profileData.skills || [],
            interests: profileData.interests || [],
            location: profileData.location || '',
            timezone: profileData.timezone || '',
            occupation: profileData.occupation || '',
            studentLevel: profileData.studentLevel || '',
            schoolName: profileData.schoolName || '',
            graduationMonth: profileData.graduationMonth || '',
            graduationYear: profileData.graduationYear?.toString() || '',
            birthMonth: profileData.birthMonth?.toString() || '',
            birthYear: profileData.birthYear?.toString() || '',
          },
          expertPrefs: {
            specialty: profileData.specialty || '',
            skills: profileData.skills || [],
            interests: profileData.interests || [],
            companyId: profileData.company?.id || '',
          },
          account: {
            username: profileData.username || '',
            email: profileData.email || '',
          },
        });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    const fetchCompanies = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/companies');
        setCompanies(response.data);
      } catch (err) {
        toast.error('Failed to load companies');
      }
    };

    fetchProfile();
    if (user.publicMetadata.role === 'EXPERT') fetchCompanies();
  }, [isLoaded, isSignedIn, user]);

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleProfileInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, githubUrl, linkedinUrl, twitterUrl, bio } = formData.profileInfo;
    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = 'Name is required';
    if (githubUrl && !validateUrl(githubUrl)) newErrors.githubUrl = 'Invalid GitHub URL';
    if (linkedinUrl && !validateUrl(linkedinUrl)) newErrors.linkedinUrl = 'Invalid LinkedIn URL';
    if (twitterUrl && !validateUrl(twitterUrl)) newErrors.twitterUrl = 'Invalid Twitter URL';
    if (bio && bio.length > 500) newErrors.bio = 'Bio must be 500 characters or less';
    setErrors({ ...errors, profileInfo: newErrors });

    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting({ ...isSubmitting, profileInfo: true });
    try {
      const response = await axios.patch('http://localhost:4000/api/profile', {
        clerkId: user!.id,
        name,
        githubUrl: githubUrl || '',
        linkedinUrl: linkedinUrl || '',
        twitterUrl: twitterUrl || '',
        bio: bio || '',
      });

      setProfile({ ...profile!, ...response.data });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSubmitting({ ...isSubmitting, profileInfo: false });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, profileInfo: { ...errors.profileInfo, profileImage: 'Image must be less than 2MB' } });
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setErrors({ ...errors, profileInfo: { ...errors.profileInfo, profileImage: 'Only JPEG or PNG images are allowed' } });
        return;
      }
      setFormData({ ...formData, profileInfo: { ...formData.profileInfo, profileImage: file } });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { profileImage } = formData.profileInfo;
    if (!profileImage) {
      setErrors({ ...errors, profileInfo: { ...errors.profileInfo, profileImage: 'Please select an image' } });
      return;
    }

    setIsSubmitting({ ...isSubmitting, profileInfo: true });
    try {
      const formData = new FormData();
      formData.append('clerkId', user!.id);
      formData.append('image', profileImage);

      const response = await axios.patch('http://localhost:4000/api/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProfile({ ...profile!, profileImageUrl: response.data.profileImageUrl });
      setPreviewImage(response.data.profileImageUrl);
      toast.success('Profile picture updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile picture');
    } finally {
      setIsSubmitting({ ...isSubmitting, profileInfo: false });
    }
  };

  const handleStudentPrefsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { specialty, skills, interests, location, timezone, occupation, studentLevel, schoolName, graduationMonth, graduationYear, birthMonth, birthYear } = formData.studentPrefs;
    const newErrors: { [key: string]: string } = {};
    if (!specialty) newErrors.specialty = 'Specialty is required';
    if (skills.length === 0) newErrors.skills = 'At least one skill is required';
    if (interests.length === 0) newErrors.interests = 'At least one interest is required';
    if (!location) newErrors.location = 'Location is required';
    if (!timezone) newErrors.timezone = 'Timezone is required';
    if (!occupation) newErrors.occupation = 'Occupation is required';
    if (!studentLevel) newErrors.studentLevel = 'Student level is required';
    if (!schoolName) newErrors.schoolName = 'School name is required';
    if (!graduationMonth) newErrors.graduationMonth = 'Graduation month is required';
    if (!graduationYear || isNaN(parseInt(graduationYear)) || parseInt(graduationYear) < 2020 || parseInt(graduationYear) > 2030) {
      newErrors.graduationYear = 'Graduation year must be between 2020 and 2030';
    }
    if (!birthMonth || isNaN(parseInt(birthMonth)) || parseInt(birthMonth) < 1 || parseInt(birthMonth) > 12) {
      newErrors.birthMonth = 'Birth month must be between 1 and 12';
    }
    if (!birthYear || isNaN(parseInt(birthYear)) || parseInt(birthYear) < 1980 || parseInt(birthYear) > 2010) {
      newErrors.birthYear = 'Birth year must be between 1980 and 2010';
    }
    setErrors({ ...errors, studentPrefs: newErrors });

    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting({ ...isSubmitting, studentPrefs: true });
    try {
      const response = await axios.patch('http://localhost:4000/api/profile/student', {
        clerkId: user!.id,
        specialty,
        skills,
        interests,
        location,
        timezone,
        occupation,
        studentLevel,
        schoolName,
        graduationMonth,
        graduationYear: parseInt(graduationYear),
        birthMonth: parseInt(birthMonth),
        birthYear: parseInt(birthYear),
      });
      setProfile({ ...profile!, ...response.data });
      toast.success('Preferences updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update preferences');
    } finally {
      setIsSubmitting({ ...isSubmitting, studentPrefs: false });
    }
  };

  const handleExpertPrefsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { specialty, skills, interests, companyId } = formData.expertPrefs;
    const newErrors: { [key: string]: string } = {};
    if (!specialty) newErrors.specialty = 'Specialty is required';
    if (skills.length === 0) newErrors.skills = 'At least one skill is required';
    if (interests.length === 0) newErrors.interests = 'At least one interest is required';
    setErrors({ ...errors, expertPrefs: newErrors });

    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting({ ...isSubmitting, expertPrefs: true });
    try {
      const response = await axios.patch('http://localhost:4000/api/profile/expert', {
        clerkId: user!.id,
        specialty,
        skills,
        interests,
        companyId: companyId || null,
      });
      setProfile({ ...profile!, ...response.data });
      toast.success('Preferences updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update preferences');
    } finally {
      setIsSubmitting({ ...isSubmitting, expertPrefs: false });
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, email } = formData.account;
    const newErrors: { [key: string]: string } = {};
    if (!username || username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email';
    setErrors({ ...errors, account: newErrors });

    if (Object.keys(newErrors).length > 0) return;

    if (username !== profile?.username) {
      try {
        const response = await axios.post('http://localhost:4000/api/check-username', { username });
        if (!response.data.available) {
          setErrors({ ...errors, account: { ...errors.account, username: 'Username already taken' } });
          return;
        }
      } catch (err) {
        toast.error('Failed to check username availability');
        return;
      }
    }

    setIsSubmitting({ ...isSubmitting, account: true });
    try {
      const response = await axios.patch('http://localhost:4000/api/profile/account', {
        clerkId: user!.id,
        username,
        email,
      });
      setProfile({ ...profile!, ...response.data });
      toast.success('Account updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update account');
    } finally {
      setIsSubmitting({ ...isSubmitting, account: false });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <IconLoader2 className="animate-spin h-10 w-10 text-yellow-400" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <IconLoader2 className="animate-spin h-10 w-10 text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-outfit">
      <Toaster position="top-right" />
      {/* Sticky Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 bg-white shadow-sm z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={previewImage || profile.profileImageUrl || user.imageUrl || '/default-avatar.png'}
              alt={`${profile.name}'s avatar`}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-yellow-400 object-cover"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-poppins font-semibold text-gray-900">{profile.name}</h1>
              <p className="text-sm font-outfit text-gray-600">@{profile.username}</p>
            </div>
          </div>
          <Link
            href={`/profile/${profile.username}`}
            className="text-yellow-400 hover:text-yellow-300 font-outfit font-medium"
          >
            Back to Profile
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:flex gap-8">
          {/* Sidebar (Desktop) */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block w-64 bg-white rounded-lg shadow-sm p-4"
          >
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection('profile')}
                className={`w-full text-left px-4 py-2 rounded-md font-outfit font-medium ${activeSection === 'profile' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <IconUser className="inline-block mr-2" size={20} /> Profile Info
              </button>
              <button
                onClick={() => setActiveSection('prefs')}
                className={`w-full text-left px-4 py-2 rounded-md font-outfit font-medium ${activeSection === 'prefs' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <IconSettings className="inline-block mr-2" size={20} /> Preference & Eligibility
              </button>
              <button
                onClick={() => setActiveSection('account')}
                className={`w-full text-left px-4 py-2 rounded-md font-outfit font-medium ${activeSection === 'account' ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <IconLock className="inline-block mr-2" size={20} /> Account & Privacy
              </button>
            </nav>
          </motion.aside>

          {/* Tabs (Mobile) */}
          <div className="lg:hidden mb-6">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveSection('profile')}
                className={`py-2 text-center font-outfit font-medium rounded-md ${activeSection === 'profile' ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600'}`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveSection('prefs')}
                className={`py-2 text-center font-outfit font-medium rounded-md ${activeSection === 'prefs' ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600'}`}
              >
                Preferences
              </button>
              <button
                onClick={() => setActiveSection('account')}
                className={`py-2 text-center font-outfit font-medium rounded-md ${activeSection === 'account' ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600'}`}
              >
                Account
              </button>
            </div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 bg-white rounded-lg shadow-sm p-6"
          >
            <AnimatePresence mode="wait">
              {activeSection === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">Profile Info</h2>
                  <form onSubmit={handleImageSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Profile Picture</label>
                      <div className="mt-1 flex items-center gap-4">
                        <img
                          src={previewImage || profile.profileImageUrl || user.imageUrl || '/default-avatar.png'}
                          alt="Profile preview"
                          className="w-16 h-16 rounded-full border-2 border-yellow-400 object-cover"
                        />
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handleImageChange}
                          className="block w-full border rounded-md p-2 text-sm text-gray-600"
                        />
                      </div>
                      {errors.profileInfo.profileImage && <p className="text-red-500 text-sm mt-1">{errors.profileInfo.profileImage}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting.profileInfo || !formData.profileInfo.profileImage}
                      className="px-4 py-2 bg-yellow-400 text-black font-outfit font-medium rounded-md hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting.profileInfo && <IconLoader2 className="animate-spin" size={20} />}
                      Update Profile Picture
                    </button>
                  </form>
                  <form onSubmit={handleProfileInfoSubmit} className="space-y-4 mt-6">
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Name</label>
                      <input
                        type="text"
                        value={formData.profileInfo.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          profileInfo: { ...formData.profileInfo, name: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.profileInfo.name && <p className="text-red-500 text-sm mt-1">{errors.profileInfo.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Bio</label>
                      <textarea
                        value={formData.profileInfo.bio}
                        onChange={(e) => setFormData({
                          ...formData,
                          profileInfo: { ...formData.profileInfo, bio: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                        rows={4}
                      />
                      {errors.profileInfo.bio && <p className="text-red-500 text-sm mt-1">{errors.profileInfo.bio}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">GitHub URL</label>
                      <input
                        type="text"
                        value={formData.profileInfo.githubUrl}
                        onChange={(e) => setFormData({
                          ...formData,
                          profileInfo: { ...formData.profileInfo, githubUrl: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.profileInfo.githubUrl && <p className="text-red-500 text-sm mt-1">{errors.profileInfo.githubUrl}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">LinkedIn URL</label>
                      <input
                        type="text"
                        value={formData.profileInfo.linkedinUrl}
                        onChange={(e) => setFormData({
                          ...formData,
                          profileInfo: { ...formData.profileInfo, linkedinUrl: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.profileInfo.linkedinUrl && <p className="text-red-500 text-sm mt-1">{errors.profileInfo.linkedinUrl}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Twitter URL</label>
                      <input
                        type="text"
                        value={formData.profileInfo.twitterUrl}
                        onChange={(e) => setFormData({
                          ...formData,
                          profileInfo: { ...formData.profileInfo, twitterUrl: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.profileInfo.twitterUrl && <p className="text-red-500 text-sm mt-1">{errors.profileInfo.twitterUrl}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting.profileInfo}
                      className="px-4 py-2 bg-yellow-400 text-black font-outfit font-medium rounded-md hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting.profileInfo && <IconLoader2 className="animate-spin" size={20} />}
                      Save Profile Changes
                    </button>
                  </form>
                </motion.div>
              )}

              {activeSection === 'prefs' && profile.role === 'STUDENT' && (
                <motion.div
                  key="student-prefs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">Preference & Eligibility</h2>
                  <form onSubmit={handleStudentPrefsSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Specialty</label>
                      <select
                        value={formData.studentPrefs.specialty}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, specialty: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      >
                        <option value="">Select Specialty</option>
                        {specialties.map((spec) => (
                          <option key={spec} value={spec}>{spec.replaceAll('_', ' ')}</option>
                        ))}
                      </select>
                      {errors.studentPrefs.specialty && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.specialty}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Skills (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.studentPrefs.skills.join(', ')}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.studentPrefs.skills && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.skills}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Interests</label>
                      <select
                        multiple
                        value={formData.studentPrefs.interests}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, interests: Array.from(e.target.selectedOptions, option => option.value) },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      >
                        {interests.map((interest) => (
                          <option key={interest} value={interest}>{interest.replaceAll('_', ' ')}</option>
                        ))}
                      </select>
                      {errors.studentPrefs.interests && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.interests}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Location</label>
                      <input
                        type="text"
                        value={formData.studentPrefs.location}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, location: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.studentPrefs.location && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.location}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Timezone</label>
                      <input
                        type="text"
                        value={formData.studentPrefs.timezone}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, timezone: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.studentPrefs.timezone && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.timezone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Occupation</label>
                      <select
                        value={formData.studentPrefs.occupation}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, occupation: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      >
                        <option value="">Select Occupation</option>
                        {occupations.map((occ) => (
                          <option key={occ} value={occ}>{occ}</option>
                        ))}
                      </select>
                      {errors.studentPrefs.occupation && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.occupation}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Student Level</label>
                      <select
                        value={formData.studentPrefs.studentLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, studentLevel: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      >
                        <option value="">Select Student Level</option>
                        {studentLevels.map((level) => (
                          <option key={level} value={level}>{level.replaceAll('_', ' ')}</option>
                        ))}
                      </select>
                      {errors.studentPrefs.studentLevel && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.studentLevel}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">School Name</label>
                      <input
                        type="text"
                        value={formData.studentPrefs.schoolName}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, schoolName: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.studentPrefs.schoolName && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.schoolName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Graduation Month</label>
                      <select
                        value={formData.studentPrefs.graduationMonth}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, graduationMonth: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      >
                        <option value="">Select Month</option>
                        {graduationMonths.map((month) => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      {errors.studentPrefs.graduationMonth && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.graduationMonth}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Graduation Year</label>
                      <input
                        type="number"
                        value={formData.studentPrefs.graduationYear}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, graduationYear: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.studentPrefs.graduationYear && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.graduationYear}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Birth Month</label>
                      <input
                        type="number"
                        value={formData.studentPrefs.birthMonth}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, birthMonth: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.studentPrefs.birthMonth && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.birthMonth}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Birth Year</label>
                      <input
                        type="number"
                        value={formData.studentPrefs.birthYear}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentPrefs: { ...formData.studentPrefs, birthYear: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.studentPrefs.birthYear && <p className="text-red-500 text-sm mt-1">{errors.studentPrefs.birthYear}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting.studentPrefs}
                      className="px-4 py-2 bg-yellow-400 text-black font-outfit font-medium rounded-md hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting.studentPrefs && <IconLoader2 className="animate-spin" size={20} />}
                      Save Changes
                    </button>
                  </form>
                </motion.div>
              )}

              {activeSection === 'prefs' && profile.role === 'EXPERT' && (
                <motion.div
                  key="expert-prefs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">Preference & Eligibility</h2>
                  <form onSubmit={handleExpertPrefsSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Specialty</label>
                      <select
                        value={formData.expertPrefs.specialty}
                        onChange={(e) => setFormData({
                          ...formData,
                          expertPrefs: { ...formData.expertPrefs, specialty: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      >
                        <option value="">Select Specialty</option>
                        {specialties.map((spec) => (
                          <option key={spec} value={spec}>{spec.replaceAll('_', ' ')}</option>
                        ))}
                      </select>
                      {errors.expertPrefs.specialty && <p className="text-red-500 text-sm mt-1">{errors.expertPrefs.specialty}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Skills (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.expertPrefs.skills.join(', ')}
                        onChange={(e) => setFormData({
                          ...formData,
                          expertPrefs: { ...formData.expertPrefs, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.expertPrefs.skills && <p className="text-red-500 text-sm mt-1">{errors.expertPrefs.skills}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Interests</label>
                      <select
                        multiple
                        value={formData.expertPrefs.interests}
                        onChange={(e) => setFormData({
                          ...formData,
                          expertPrefs: { ...formData.expertPrefs, interests: Array.from(e.target.selectedOptions, option => option.value) },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      >
                        {interests.map((interest) => (
                          <option key={interest} value={interest}>{interest.replaceAll('_', ' ')}</option>
                        ))}
                      </select>
                      {errors.expertPrefs.interests && <p className="text-red-500 text-sm mt-1">{errors.expertPrefs.interests}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Company</label>
                      <select
                        value={formData.expertPrefs.companyId}
                        onChange={(e) => setFormData({
                          ...formData,
                          expertPrefs: { ...formData.expertPrefs, companyId: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      >
                        <option value="">No Company</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                    {profile.company && (
                      <div>
                        <label className="block text-sm font-outfit text-gray-600">Approval Status</label>
                        <p className="text-gray-600 text-sm">{profile.isApprovedInCompany ? 'Approved' : 'Pending'}</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting.expertPrefs}
                      className="px-4 py-2 bg-yellow-400 text-black font-outfit font-medium rounded-md hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting.expertPrefs && <IconLoader2 className="animate-spin" size={20} />}
                      Save Changes
                    </button>
                  </form>
                </motion.div>
              )}

              {activeSection === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">Account & Privacy</h2>
                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Username</label>
                      <input
                        type="text"
                        value={formData.account.username}
                        onChange={(e) => setFormData({
                          ...formData,
                          account: { ...formData.account, username: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.account.username && <p className="text-red-500 text-sm mt-1">{errors.account.username}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-outfit text-gray-600">Email</label>
                      <input
                        type="email"
                        value={formData.account.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          account: { ...formData.account, email: e.target.value },
                        })}
                        className="mt-1 block w-full border rounded-md p-2 text-sm"
                      />
                      {errors.account.email && <p className="text-red-500 text-sm mt-1">{errors.account.email}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting.account}
                      className="px-4 py-2 bg-yellow-400 text-black font-outfit font-medium rounded-md hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting.account && <IconLoader2 className="animate-spin" size={20} />}
                      Save Changes
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
