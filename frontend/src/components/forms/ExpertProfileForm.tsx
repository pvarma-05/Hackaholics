'use client';

import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expertProfileSchema, specialtyOptions, interestOptions } from '../../../schemas/expertProfileSchema';
import Select from 'react-select';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { IconLoader2 } from '@tabler/icons-react';
import axios from 'axios';
import { motion } from 'framer-motion';

type FormData = z.infer<typeof expertProfileSchema>;

const selectSpecialtyOptions = specialtyOptions.map((value) => ({
  value,
  label: value.replaceAll('_', ' '),
}));
const selectInterestOptions = interestOptions.map((value) => ({
  value,
  label: value.replaceAll('_', ' '),
}));

export default function ExpertProfileForm() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [companyMode, setCompanyMode] = useState<'select' | 'create'>('select');
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(expertProfileSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      profileImageUrl: undefined,
      specialty: 'FULL_STACK',
      skills: [],
      bio: undefined,
      interests: [],
      isCreatingCompany: false,
      existingCompanyId: undefined,
      newCompany: undefined, // Changed to undefined
    },
  });

  const isCreatingCompany = watch('isCreatingCompany');

  // Log form errors for debugging
  useEffect(() => {
    console.log('Current form errors:', errors);
  }, [errors]);

  useEffect(() => {
    if (user) {
      setValue('name', user.fullName || '');
      setValue('email', user.primaryEmailAddress?.emailAddress || '');
      setValue('profileImageUrl', user.imageUrl || undefined);
    }
  }, [user, setValue]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/companies');
        const fetchedCompanies = response.data.map((company: { id: string; name: string }) => ({
          value: company.id,
          label: company.name,
        }));
        setCompanies(fetchedCompanies);
        console.log('Fetched companies:', fetchedCompanies);
      } catch (error: any) {
        console.error('Fetch companies error:', error);
        setSubmissionError(error.response?.data?.error || 'Failed to load companies. Please try again.');
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    setValue('isCreatingCompany', companyMode === 'create');
    // Clear fields when switching modes
    if (companyMode === 'create') {
      setValue('existingCompanyId', undefined);
      setValue('newCompany', {
        name: '',
        websiteUrl: undefined,
        description: undefined,
        phoneNumber: '',
        emailDomain: undefined,
      });
    } else {
      setValue('newCompany', undefined); // Set to undefined
      setValue('existingCompanyId', undefined); // Reset to force selection
    }
    trigger(['existingCompanyId', 'newCompany']);
  }, [companyMode, setValue, trigger]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameError('Username is required');
      setIsUsernameAvailable(null);
      return false;
    }
    try {
      const response = await axios.post('http://localhost:4000/api/check-username', { username });
      if (response.data.error) {
        setUsernameError(response.data.error);
        setIsUsernameAvailable(false);
        return false;
      }
      if (!response.data.available) {
        setUsernameError('Username is already taken');
        setIsUsernameAvailable(false);
        return false;
      }
      setUsernameError(null);
      setIsUsernameAvailable(true);
      return true;
    } catch (error: any) {
      console.error('Username check network error:', error);
      setUsernameError(error.response?.data?.error || 'Error checking username availability');
      setIsUsernameAvailable(false);
      return false;
    }
  };

  let debounceTimer: NodeJS.Timeout;

  const handleUsernameChange = (value: string) => {
    setValue('username', value);
    setUsernameError(null);
    setIsUsernameAvailable(null);

    clearTimeout(debounceTimer);
    if (value.trim().length < 3) return;

    debounceTimer = setTimeout(() => checkUsernameAvailability(value), 500);
  };

  const handleSkillsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && skillsInput.trim()) {
      e.preventDefault();
      const newSkills = [...skills, skillsInput.trim()];
      setSkills(newSkills);
      setValue('skills', newSkills);
      setSkillsInput('');
      trigger('skills');
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
    setValue('skills', newSkills);
    trigger('skills');
  };

  const onSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data);
    if (!user) {
      setSubmissionError('User not authenticated. Please log in.');
      return;
    }
    setSubmitting(true);
    setSubmissionError(null);
    setUsernameError(null);

    try {
      // Validate username availability
      const isUsernameAvailable = await checkUsernameAvailability(data.username);
      if (!isUsernameAvailable) {
        return;
      }

      // Log payload for debugging
      const profilePayload = {
        clerkId: user.id,
        role: 'EXPERT',
        name: data.name,
        username: data.username,
        email: data.email,
        profileImageUrl: data.profileImageUrl || '',
        specialty: data.specialty,
        skills: data.skills,
        bio: data.bio || null,
        interests: data.interests,
        companyId: data.isCreatingCompany ? null : data.existingCompanyId || null,
        isApprovedInCompany: data.isCreatingCompany ? true : false,
      };
      console.log('Submitting profile with payload:', profilePayload);

      const profileResponse = await axios.post('http://localhost:4000/api/profile/expert', profilePayload);
      console.log('Profile response:', profileResponse.data);

      const userId = profileResponse.data.id;

      let companyId = data.existingCompanyId;
      if (data.isCreatingCompany && data.newCompany) {
        try {
          const companyPayload = {
            name: data.newCompany.name,
            websiteUrl: data.newCompany.websiteUrl || null,
            description: data.newCompany.description || null,
            phoneNumber: data.newCompany.phoneNumber,
            emailDomain: data.newCompany.emailDomain || '',
            createdById: userId,
          };
          console.log('Creating company with payload:', companyPayload);
          const companyResponse = await axios.post('http://localhost:4000/api/companies', companyPayload);
          console.log('Company response:', companyResponse.data);
          companyId = companyResponse.data.id;

          const patchPayload = {
            clerkId: user.id,
            companyId,
            isApprovedInCompany: true,
          };
          console.log('Patching profile with payload:', patchPayload);
          const patchResponse = await axios.patch('http://localhost:4000/api/profile/expert', patchPayload);
          console.log('Patch response:', patchResponse.data);
        } catch (companyError: any) {
          console.error('Company creation error:', companyError);
          throw new Error(companyError.response?.data?.error || 'Failed to create company');
        }
      }

      router.push('/');
    } catch (error: any) {
      console.error('Profile submission error:', error);
      setSubmissionError(error.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl space-y-6"
      >
        <h1 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">
          Complete Your Expert Profile
        </h1>

        {submissionError && (
          <p className="text-red-500 text-sm font-outfit mb-4">{submissionError}</p>
        )}
        {errors.newCompany && !isCreatingCompany && (
          <p className="text-red-500 text-sm font-outfit mb-4">
            New company fields should not be required when joining an existing company.
          </p>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Name</label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                placeholder="John Doe"
              />
            )}
          />
          {errors.name && (
            <p className="text-red-500 text-sm font-outfit mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Username</label>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleUsernameChange(e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                placeholder="john_doe123"
              />
            )}
          />
          {errors.username && (
            <p className="text-red-500 text-sm font-outfit mt-1">{errors.username.message}</p>
          )}
          {usernameError && (
            <p className="text-red-500 text-sm font-outfit mt-1">{usernameError}</p>
          )}
          {isUsernameAvailable && !usernameError && (
            <p className="text-green-500 text-sm font-outfit mt-1">Username is available ✅</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Email</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 bg-gray-100"
                readOnly
              />
            )}
          />
          {errors.email && (
            <p className="text-red-500 text-sm font-outfit mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Specialty */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Specialty</label>
          <Controller
            name="specialty"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              >
                {selectSpecialtyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.specialty && (
            <p className="text-red-500 text-sm font-outfit mt-1">{errors.specialty.message}</p>
          )}
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Skills</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="bg-yellow-300/20 text-yellow-300/80 px-3 py-1 rounded-full flex items-center"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="ml-2 text-red-500 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Controller
            name="skills"
            control={control}
            render={({ field }) => (
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyDown={handleSkillsKeyDown}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                placeholder="Type a skill and press space (e.g., Node.js)"
              />
            )}
          />
          {errors.skills && (
            <p className="text-red-500 text-sm font-outfit mt-1">{errors.skills.message}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Bio (Optional)</label>
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                value={field.value || ''}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                placeholder="Tell us about yourself..."
                rows={4}
              />
            )}
          />
          {errors.bio && (
            <p className="text-red-500 text-sm font-outfit mt-1">{errors.bio.message}</p>
          )}
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Interests</label>
          <Controller
            name="interests"
            control={control}
            render={({ field }) => (
              <Select
                isMulti
                options={selectInterestOptions}
                value={selectInterestOptions.filter((opt) => field.value.includes(opt.value))}
                onChange={(selected) => {
                  field.onChange(selected.map((opt: { value: string }) => opt.value));
                  trigger('interests');
                }}
                className="font-outfit"
                classNamePrefix="select"
                placeholder="Select interests..."
              />
            )}
          />
          {errors.interests && (
            <p className="text-red-500 text-sm font-outfit mt-1">{errors.interests.message}</p>
          )}
        </div>

        {/* Company Selection */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Company</label>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setCompanyMode('select')}
              className={`flex-1 p-2 rounded-lg font-outfit ${companyMode === 'select'
                ? 'bg-yellow-300/70 text-black'
                : 'bg-gray-200/50 text-gray-600'
                }`}
            >
              Join Existing Company
            </button>
            <button
              type="button"
              onClick={() => setCompanyMode('create')}
              className={`flex-1 p-2 rounded-lg font-outfit ${companyMode === 'create'
                ? 'bg-yellow-300/70 text-black'
                : 'bg-gray-200/50 text-gray-600'
                }`}
            >
              Create New Company
            </button>
          </div>

          {companyMode === 'select' ? (
            <div>
              <Controller
                name="existingCompanyId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={companies}
                    value={companies.find((c) => c.value === field.value) || null}
                    onChange={(selected) => {
                      console.log('Selected existingCompanyId:', selected?.value);
                      field.onChange(selected?.value || null);
                      trigger('existingCompanyId');
                    }}
                    className="font-outfit"
                    classNamePrefix="select"
                    placeholder="Select a company..."
                  />
                )}
              />
              {errors.existingCompanyId && (
                <p className="text-red-500 text-sm font-outfit mt-1">
                  {errors.existingCompanyId.message}
                </p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-outfit text-gray-600 mb-1">
                  Company Name
                </label>
                <Controller
                  name="newCompany.name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      onBlur={() => trigger('newCompany.name')}
                      className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                      placeholder="Acme Corp"
                    />
                  )}
                />
                {errors.newCompany?.name && (
                  <p className="text-red-500 text-sm font-outfit mt-1">
                    {errors.newCompany.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-outfit text-gray-600 mb-1">
                  Website URL (Optional)
                </label>
                <Controller
                  name="newCompany.websiteUrl"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ''}
                      onBlur={() => trigger('newCompany.websiteUrl')}
                      className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                      placeholder="https://example.com"
                    />
                  )}
                />
                {errors.newCompany?.websiteUrl && (
                  <p className="text-red-500 text-sm font-outfit mt-1">
                    {errors.newCompany.websiteUrl.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-outfit text-gray-600 mb-1">
                  Description (Optional)
                </label>
                <Controller
                  name="newCompany.description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      value={field.value || ''}
                      onBlur={() => trigger('newCompany.description')}
                      className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                      placeholder="About your company..."
                      rows={3}
                    />
                  )}
                />
                {errors.newCompany?.description && (
                  <p className="text-red-500 text-sm font-outfit mt-1">
                    {errors.newCompany.description.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-outfit text-gray-600 mb-1">
                  Phone Number
                </label>
                <Controller
                  name="newCompany.phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      onBlur={() => trigger('newCompany.phoneNumber')}
                      className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                      placeholder="+1234567890"
                    />
                  )}
                />
                {errors.newCompany?.phoneNumber && (
                  <p className="text-red-500 text-sm font-outfit mt-1">
                    {errors.newCompany.phoneNumber.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-outfit text-gray-600 mb-1">
                  Email Domain (Optional)
                </label>
                <Controller
                  name="newCompany.emailDomain"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ''}
                      onBlur={() => trigger('newCompany.emailDomain')}
                      className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                      placeholder="example.com"
                    />
                  )}
                />
                {errors.newCompany?.emailDomain && (
                  <p className="text-red-500 text-sm font-outfit mt-1">
                    {errors.newCompany.emailDomain.message}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !!usernameError}
          className={`w-full p-3 rounded-lg font-outfit font-semibold text-black ${submitting || usernameError
            ? 'bg-yellow-300/30 cursor-not-allowed'
            : 'bg-yellow-300/70 hover:bg-yellow-300/60'
            } transition-colors duration-200`}
        >
          {submitting ? (
            <>
              <IconLoader2 className="animate-spin h-5 w-5 mr-2 inline" />
              Submitting...
            </>
          ) : (
            'Submit Profile'
          )}
        </button>
      </form>
    </motion.div>
  );
}
