'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { IconLoader2, IconCalendar } from '@tabler/icons-react';
import { DayPicker } from 'react-day-picker';

import {
  HackathonFormData,
  hackathonFormSchema,
  HackathonReviewType,
} from '../../../schemas/hackathonSchema';



interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right' | 'center';
}

const SimplePopover: React.FC<PopoverProps> = ({ children, content, isOpen, onOpenChange, align = 'left' }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  const popoverClasses = `absolute z-10 bg-white rounded-lg shadow-lg mt-2 font-outfit ${
    align === 'center' ? 'left-1/2 -translate-x-1/2' :
    align === 'right' ? 'right-0' : 'left-0'
  }`;

  return (
    <div className="relative inline-block w-full" ref={popoverRef}>
      {children}
      {isOpen && (
        <div className={popoverClasses}>
          {content}
        </div>
      )}
    </div>
  );
};

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}



interface FetchedExpertProfile {
  username: string;
  name: string;
  role: 'STUDENT' | 'EXPERT';
  company?: { id: string; name: string } | null;
  isApprovedInCompany?: boolean;
}


export function CreateHackathonForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [expertAssociatedCompany, setExpertAssociatedCompany] = useState<{ id: string; name: string } | null>(null);
  const [loadingExpertCompany, setLoadingExpertCompany] = useState(true);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [isRegEndDatePickerOpen, setIsRegEndDatePickerOpen] = useState(false);
  const [isSubEndDatePickerOpen, setIsSubEndDatePickerOpen] = useState(false);


  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    clearErrors,
  } = useForm<HackathonFormData>({
    resolver: zodResolver(hackathonFormSchema),
    defaultValues: {
      reviewType: 'MANUAL',
      title: '',
      description: '',
      rules: '',
      bannerImageUrl: undefined,
      startDate: '',
      endDate: '',
      registrationEndDate: '',
      submissionEndDate: '',
    },
  });

  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');
  const watchRegistrationEndDate = watch('registrationEndDate');
  const watchSubmissionEndDate = watch('submissionEndDate');

  useEffect(() => {
    const fetchExpertCompany = async () => {
      if (!user?.username || user.publicMetadata?.role !== 'EXPERT') {
        setLoadingExpertCompany(false);
        return;
      }

      setLoadingExpertCompany(true);
      try {
        const token = await getToken();
        const response = await axios.get<FetchedExpertProfile>(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/${user.username}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const profileData = response.data;

        if (profileData.role === 'EXPERT' && profileData.company && profileData.isApprovedInCompany) {
            setExpertAssociatedCompany({
                id: profileData.company.id,
                name: profileData.company.name
            });
        } else {
            setExpertAssociatedCompany(null);
        }
      } catch (error) {
        console.error('Failed to fetch expert profile for company auto-fill:', error);
        setExpertAssociatedCompany(null);
      } finally {
        setLoadingExpertCompany(false);
      }
    };

    fetchExpertCompany();
  }, [user, getToken]);


  const onSubmit = async (data: HackathonFormData) => {
    setSubmitLoading(true);
    setFormError(null);
    clearErrors('bannerImageUrl');

    const companyIdToSubmit = expertAssociatedCompany?.id || null;

    try {
      let finalBannerImageUrl: string | undefined;

      const imageFile = (document.getElementById('bannerImageUpload') as HTMLInputElement)?.files?.[0];
      if (imageFile) {
        if (imageFile.size > 2 * 1024 * 1024) {
            setFormError('Banner image size must be less than 2MB.');
            setSubmitLoading(false);
            return;
        }
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(imageFile.type)) {
            setFormError('Only JPEG or PNG images are allowed for banner.');
            setSubmitLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('image', imageFile);

        const token = await getToken();
        const uploadResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/imagekit/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        finalBannerImageUrl = uploadResponse.data.url;
      } else {

          finalBannerImageUrl = undefined;
      }

      const hackathonPayload = {
        ...data,

        bannerImageUrl: finalBannerImageUrl,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        registrationEndDate: new Date(data.registrationEndDate).toISOString(),
        submissionEndDate: new Date(data.submissionEndDate).toISOString(),
        companyId: companyIdToSubmit,
      };

      const token = await getToken();
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hackathons`,
        hackathonPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Hackathon created:', response.data);
      router.push(`/hackathons/${response.data.slug}`);
    } catch (err: any) {
      console.error('Error creating hackathon:', err);
      setFormError(err.response?.data?.error || 'Failed to create hackathon. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loadingExpertCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
        <p className="ml-2 font-outfit text-gray-700">Loading expert company info...</p>
      </div>
    );
  }

  if (user && user.publicMetadata?.role !== 'EXPERT') {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl space-y-6 font-outfit"
      >
        <h2 className="text-3xl font-poppins font-semibold text-gray-900 mb-6">
          Create New Hackathon
        </h2>

        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-sm">
            <span className="block">{formError}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
            Hackathon Title
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            placeholder="Innovate for a Better Tomorrow"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={5}
            {...register('description')}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            placeholder="Provide a detailed description of the hackathon, its theme, and goals."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Rules */}
        <div>
          <label htmlFor="rules" className="block text-sm font-semibold text-gray-700 mb-1">
            Rules (Optional)
          </label>
          <textarea
            id="rules"
            rows={4}
            {...register('rules')}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            placeholder="Outline the rules, eligibility, judging criteria, etc. (Markdown/Rich text support coming soon)"
          />
          {errors.rules && (
            <p className="text-red-500 text-sm mt-1">{errors.rules.message}</p>
          )}
        </div>

        {/* Banner Image Upload - REMOVED register('bannerImageUrl') from here */}
        <div>
          <label htmlFor="bannerImageUpload" className="block text-sm font-semibold text-gray-700 mb-1">
            Banner Image
          </label>
          <input
            id="bannerImageUpload"
            type="file"
            accept="image/png, image/jpeg"
            className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-600
                       file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                       file:text-sm file:font-semibold file:bg-yellow-300/70 file:text-black
                       hover:file:bg-yellow-300/60 cursor-pointer"

          />
          {errors.bannerImageUrl && <p className="text-red-500 text-sm mt-1">{errors.bannerImageUrl.message}</p>}
          <p className="mt-2 text-xs text-gray-500">Upload a compelling banner image (JPEG or PNG, max 2MB).</p>
        </div>


        {/* Date Pickers Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-1">
              Start Date
            </label>
            <SimplePopover
              isOpen={isStartDatePickerOpen}
              onOpenChange={setIsStartDatePickerOpen}
              content={
                <DayPicker
                  mode="single"
                  selected={watchStartDate ? new Date(watchStartDate) : undefined}
                  onSelect={(date) => {
                    setValue('startDate', date ? format(date, 'yyyy-MM-dd') : '');
                    setIsStartDatePickerOpen(false);
                  }}
                  initialFocus
                  className="font-outfit"
                />
              }
            >
              <button
                type="button"
                onClick={() => setIsStartDatePickerOpen(true)}
                className="w-full p-3 border border-gray-300 rounded-lg text-left text-gray-900 flex items-center justify-between
                            focus:outline-none focus:ring-2 focus:ring-yellow-300/70 bg-white"
              >
                {watchStartDate ? format(new Date(watchStartDate), 'PPP') : 'Select start date'}
                <IconCalendar size={20} className="text-gray-500" />
              </button>
            </SimplePopover>
            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-1">
              End Date
            </label>
            <SimplePopover
              isOpen={isEndDatePickerOpen}
              onOpenChange={setIsEndDatePickerOpen}
              content={
                <DayPicker
                  mode="single"
                  selected={watchEndDate ? new Date(watchEndDate) : undefined}
                  onSelect={(date) => {
                    setValue('endDate', date ? format(date, 'yyyy-MM-dd') : '');
                    setIsEndDatePickerOpen(false);
                  }}
                  initialFocus
                  className="font-outfit"
                />
              }
            >
              <button
                type="button"
                onClick={() => setIsEndDatePickerOpen(true)}
                className="w-full p-3 border border-gray-300 rounded-lg text-left text-gray-900 flex items-center justify-between
                            focus:outline-none focus:ring-2 focus:ring-yellow-300/70 bg-white"
              >
                {watchEndDate ? format(new Date(watchEndDate), 'PPP') : 'Select end date'}
                <IconCalendar size={20} className="text-gray-500" />
              </button>
            </SimplePopover>
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
          </div>

          {/* Registration End Date */}
          <div>
            <label htmlFor="registrationEndDate" className="block text-sm font-semibold text-gray-700 mb-1">
              Registration End Date
            </label>
            <SimplePopover
              isOpen={isRegEndDatePickerOpen}
              onOpenChange={setIsRegEndDatePickerOpen}
              content={
                <DayPicker
                  mode="single"
                  selected={watchRegistrationEndDate ? new Date(watchRegistrationEndDate) : undefined}
                  onSelect={(date) => {
                    setValue('registrationEndDate', date ? format(date, 'yyyy-MM-dd') : '');
                    setIsRegEndDatePickerOpen(false);
                  }}
                  initialFocus
                  className="font-outfit"
                />
              }
            >
              <button
                type="button"
                onClick={() => setIsRegEndDatePickerOpen(true)}
                className="w-full p-3 border border-gray-300 rounded-lg text-left text-gray-900 flex items-center justify-between
                            focus:outline-none focus:ring-2 focus:ring-yellow-300/70 bg-white"
              >
                {watchRegistrationEndDate ? format(new Date(watchRegistrationEndDate), 'PPP') : 'Select reg. end date'}
                <IconCalendar size={20} className="text-gray-500" />
              </button>
            </SimplePopover>
            {errors.registrationEndDate && <p className="text-red-500 text-sm mt-1">{errors.registrationEndDate.message}</p>}
          </div>

          {/* Submission End Date */}
          <div>
            <label htmlFor="submissionEndDate" className="block text-sm font-semibold text-gray-700 mb-1">
              Submission End Date
            </label>
            <SimplePopover
              isOpen={isSubEndDatePickerOpen}
              onOpenChange={setIsSubEndDatePickerOpen}
              content={
                <DayPicker
                  mode="single"
                  selected={watchSubmissionEndDate ? new Date(watchSubmissionEndDate) : undefined}
                  onSelect={(date) => {
                    setValue('submissionEndDate', date ? format(date, 'yyyy-MM-dd') : '');
                    setIsSubEndDatePickerOpen(false);
                  }}
                  initialFocus
                  className="font-outfit"
                />
              }
            >
              <button
                type="button"
                onClick={() => setIsSubEndDatePickerOpen(true)}
                className="w-full p-3 border border-gray-300 rounded-lg text-left text-gray-900 flex items-center justify-between
                            focus:outline-none focus:ring-2 focus:ring-yellow-300/70 bg-white"
              >
                {watchSubmissionEndDate ? format(new Date(watchSubmissionEndDate), 'PPP') : 'Select sub. end date'}
                <IconCalendar size={20} className="text-gray-500" />
              </button>
            </SimplePopover>
            {errors.submissionEndDate && <p className="text-red-500 text-sm mt-1">{errors.submissionEndDate.message}</p>}
          </div>
        </div>

        {/* Review Type (Keep as is) */}
        <div>
          <label htmlFor="reviewType" className="block text-sm font-semibold text-gray-700 mb-1">
            Project Review Method
          </label>
          <select
            id="reviewType"
            {...register('reviewType')}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
          >
            {Object.values(HackathonReviewType.enum).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {errors.reviewType && (
            <p className="text-red-500 text-sm mt-1">{errors.reviewType.message}</p>
          )}
        </div>

        {/* --- Dynamic Company Association Message --- */}
        {!loadingExpertCompany && expertAssociatedCompany ? (
          <div className="bg-yellow-50 text-yellow-900 p-3 rounded-md text-sm border border-yellow-200">
            Hackathon will be associated with your company:{' '}
            <span className="font-semibold">{expertAssociatedCompany.name}</span>
            <input type="hidden" {...register('companyId')} value={expertAssociatedCompany.id} />
          </div>
        ) : !loadingExpertCompany && user?.publicMetadata?.role === 'EXPERT' ? (
          <div className="bg-blue-50 text-blue-900 p-3 rounded-md text-sm border border-blue-200">
            You are not currently associated with an approved company. This hackathon will be hosted independently. You can associate a company in your profile settings.
            <input type="hidden" {...register('companyId')} value={null as any} />
          </div>
        ) : null}
        {/* --- End Dynamic Company Association Message --- */}

        {/* Submit Button (Keep as is) */}
        <button
          type="submit"
          disabled={submitLoading || loadingExpertCompany}
          className={`w-full p-3 rounded-lg font-outfit font-semibold text-black flex items-center justify-center gap-2
                      ${(submitLoading || loadingExpertCompany)
                          ? 'bg-yellow-300/30 cursor-not-allowed'
                          : 'bg-yellow-300/70 hover:bg-yellow-300/60'
                      } transition-colors duration-200`}
        >
          {submitLoading ? (
            <>
              <IconLoader2 className="animate-spin h-5 w-5" />
              Creating Hackathon...
            </>
          ) : (
            'Create Hackathon'
          )}
        </button>
      </form>
    </div>
  );
}
