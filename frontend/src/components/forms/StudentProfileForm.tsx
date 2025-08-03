'use client';

import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentProfileSchema } from '../../../schemas/studentProfileSchema';
import Select from 'react-select';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { IconLoader2 } from '@tabler/icons-react';
import axios from 'axios';
import { motion } from 'framer-motion';

type FormData = z.infer<typeof studentProfileSchema>;

const specialtyOptions = studentProfileSchema.shape.specialty.options;
const interestOptions = studentProfileSchema.shape.interests._def.type.options.map((value) => ({
  value,
  label: value.replaceAll('_', ' '),
}));
const occupationOptions = studentProfileSchema.shape.occupation.options;
const studentLevelOptions = studentProfileSchema.shape.studentLevel.options;
const graduationMonthOptions = studentProfileSchema.shape.graduationMonth.options;

export default function StudentProfileForm() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      name: user?.fullName || '',
      username: '',
      email: user?.primaryEmailAddress?.emailAddress || '',
      profileImageUrl: user?.imageUrl || '',
      specialty: 'FULL_STACK',
      skills: [],
      bio: '',
      interests: [],
      location: '',
      timezone: '',
      occupation: 'STUDENT',
      studentLevel: 'COLLEGE',
      schoolName: '',
      graduationMonth: 'MAY',
      graduationYear: new Date().getFullYear(),
      birthMonth: 1,
      birthYear: 2002,
    },
  });

  useEffect(() => {
    if (user) {
      setValue('name', user.fullName || '');
      setValue('email', user.primaryEmailAddress?.emailAddress || '');
      setValue('profileImageUrl', user.imageUrl || '');
    }
  }, [user, setValue]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameError('Username is required');
      setIsUsernameAvailable(null);
      return false;
    }
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/check-username`, { username });
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
    console.log('Form errors:', errors);
    if (!user) {
      setSubmissionError('User not authenticated. Please log in.');
      return;
    }
    console.log('Form submitted with data:', data);
    setSubmitting(true);
    setSubmissionError(null);
    setUsernameError(null);

    try {
      const isUsernameAvailable = await checkUsernameAvailability(data.username);
      if (!isUsernameAvailable) {
        return;
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/student`, {
        ...data,
        clerkId: user.id,
        role: 'STUDENT',
      });
      console.log('Profile response:', response.data);
      router.push('/');
    } catch (error: any) {
      console.error('Profile submission error:', error);
      if (error.response?.data?.error === 'Username is already taken') {
        setUsernameError('Username is already taken');
      } else {
        setSubmissionError(error.response?.data?.error || 'Failed to save profile. Please try again.');
      }
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
          Complete Your Student Profile
        </h1>

        {submissionError && (
          <p className="text-red-500 text-sm font-outfit mb-4">{submissionError}</p>
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
          {errors.name && <p className="text-red-500 text-sm font-outfit mt-1">{errors.name.message}</p>}
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
          {errors.email && <p className="text-red-500 text-sm font-outfit mt-1">{errors.email.message}</p>}
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
                {specialtyOptions.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.specialty && <p className="text-red-500 text-sm font-outfit mt-1">{errors.specialty.message}</p>}
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
                placeholder="Type a skill and press space (e.g., React)"
              />
            )}
          />
          {errors.skills && <p className="text-red-500 text-sm font-outfit mt-1">{errors.skills.message}</p>}
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
                options={interestOptions}
                value={interestOptions.filter((opt) => field.value.includes(opt.value))}
                onChange={(selected) => field.onChange(selected.map((opt: any) => opt.value))}
                className="font-outfit"
                classNamePrefix="select"
                placeholder="Select interests..."
              />
            )}
          />
          {errors.interests && <p className="text-red-500 text-sm font-outfit mt-1">{errors.interests.message}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Location</label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                placeholder="Hyderabad, India"
              />
            )}
          />
          {errors.location && <p className="text-red-500 text-sm font-outfit mt-1">{errors.location.message}</p>}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Timezone</label>
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                placeholder="Asia/Kolkata"
              />
            )}
          />
          {errors.timezone && <p className="text-red-500 text-sm font-outfit mt-1">{errors.timezone.message}</p>}
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Occupation</label>
          <Controller
            name="occupation"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              >
                {occupationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.occupation && <p className="text-red-500 text-sm font-outfit mt-1">{errors.occupation.message}</p>}
        </div>

        {/* Student Level */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Student Level</label>
          <Controller
            name="studentLevel"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              >
                {studentLevelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.studentLevel && <p className="text-red-500 text-sm font-outfit mt-1">{errors.studentLevel.message}</p>}
        </div>

        {/* School Name */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">School/College Name</label>
          <Controller
            name="schoolName"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                placeholder="IIT Bombay"
              />
            )}
          />
          {errors.schoolName && <p className="text-red-500 text-sm font-outfit mt-1">{errors.schoolName.message}</p>}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-outfit text-gray-600 mb-1">Bio</label>
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                placeholder="Tell us about yourself..."
                rows={4}
              />
            )}
          />
          {errors.bio && <p className="text-red-500 text-sm font-outfit mt-1">{errors.bio.message}</p>}
        </div>

        {/* Graduation Month/Year */}
        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm font-outfit text-gray-600 mb-1">Graduation Month</label>
            <Controller
              name="graduationMonth"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                >
                  {graduationMonthOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.graduationMonth && (
              <p className="text-red-500 text-sm font-outfit mt-1">{errors.graduationMonth.message}</p>
            )}
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-outfit text-gray-600 mb-1">Graduation Year</label>
            <Controller
              name="graduationYear"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                />
              )}
            />
            {errors.graduationYear && (
              <p className="text-red-500 text-sm font-outfit mt-1">{errors.graduationYear.message}</p>
            )}
          </div>
        </div>

        {/* Birth Month/Year */}
        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm font-outfit text-gray-600 mb-1">Birth Month</label>
            <Controller
              name="birthMonth"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  min={1}
                  max={12}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                />
              )}
            />
            {errors.birthMonth && <p className="text-red-500 text-sm font-outfit mt-1">{errors.birthMonth.message}</p>}
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-outfit text-gray-600 mb-1">Birth Year</label>
            <Controller
              name="birthYear"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() - 12}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                />
              )}
            />
            {errors.birthYear && <p className="text-red-500 text-sm font-outfit mt-1">{errors.birthYear.message}</p>}
          </div>
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
              <IconLoader2 className="animate-spin h-5 w-5 mr-2" />
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
