'use client';

import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { signUpSchema } from '../../../schemas/signUpSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IconLoader2 } from '@tabler/icons-react';
import Link from 'next/link';

type SignUpStatus = 'missing_requirements' | 'complete' | 'abandoned';
const isValidSignUpStatus = (status: any): status is SignUpStatus =>
  ['missing_requirements', 'complete', 'abandoned'].includes(status);

export default function SignUpForm() {
  const router = useRouter();
  const { signUp, isLoaded, setActive } = useSignUp();
  const [verifying, setVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authErrors, setAuthErrors] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resend, setResend] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    reset({ email: '' });
    setAuthErrors(null);
    setVerificationError(null);
    setVerificationCode('');
  }, [reset]);

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    if (isValidSignUpStatus(signUp.status)) {
      if (signUp.status === 'complete') {
        setVerifying(false);
        router.push('/complete-profile');
      } else if (signUp.status === 'missing_requirements' && !verifying) {
        setVerifying(true);
      }
    }
  }, [isLoaded, signUp, router, verifying]);

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (!isLoaded || !signUp) return;
    setIsSubmitting(true);
    setAuthErrors(null);

    try {
      await signUp.create({
        emailAddress: data.email,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      setVerifying(true);
    } catch (error: any) {
      console.error('Signup Error:', error);
      setAuthErrors(
        error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'An error occurred during sign-up. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !signUp) return;
    if (isValidSignUpStatus(signUp.status) && signUp.status === 'complete') {
      router.push('/complete-profile');
      return;
    }
    setVerificationError(null);
    setResend(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setResend('New code sent to your email.');
    } catch (error: any) {
      console.error('Resend Error:', error);
      setVerificationError(
        error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Failed to resend code. Try again.'
      );
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded || !signUp || !isValidSignUpStatus(signUp.status)) {
      setVerificationError('Invalid verification state. Please try signing up again.');
      return;
    }
    if (signUp.status !== 'missing_requirements') {
      setVerificationError('Verification not ready. Please resend the code.');
      return;
    }
    setIsSubmitting(true);
    setVerificationError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setVerificationCode('');
        setVerifying(false);
        router.push('/complete-profile');
      } else {
        setVerificationError(`Verification failed: ${result.status || 'Unknown status'}`);
      }
    } catch (error: any) {
      console.error('Verification Error:', error);
      setVerificationError(
        error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Invalid or expired code. Try resending.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <IconLoader2 className="animate-spin h-8 w-8 text-yellow-300/70" />
      </div>
    );
  }

  if (verifying && isValidSignUpStatus(signUp?.status) && signUp?.status === 'missing_requirements') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
      >
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">
            Verify Your Email
          </h1>
          <p className="font-outfit text-gray-600 text-sm mb-6">
            Enter the 6-digit code sent to your email address.
          </p>
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-outfit text-gray-600 mb-1">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                maxLength={6}
                required
              />
              {verificationError && (
                <p className="text-red-500 text-sm font-outfit mt-1">{verificationError}</p>
              )}
              {resend && (
                <p className="text-green-500 text-sm font-outfit mt-1">{resend}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || verificationCode.length !== 6}
              className={`w-full flex items-center justify-center p-3 rounded-lg font-outfit font-semibold text-black ${isSubmitting || verificationCode.length !== 6
                ? 'bg-yellow-300/30 cursor-not-allowed'
                : 'bg-yellow-300/70 hover:bg-yellow-300/60'
                } transition-colors duration-200`}
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="animate-spin h-5 w-5 mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>
          <p className="font-outfit text-gray-600 text-sm text-center mt-4">
            Didn’t receive a code?{' '}
            <button
              onClick={handleResend}
              disabled={isSubmitting}
              className="text-yellow-300/70 hover:underline font-medium disabled:opacity-50"
            >
              Resend
            </button>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
        key={signUp?.status}
      >
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md flex flex-col gap-2">
          <h1 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">
            Sign Up to Hackaholics
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-outfit text-gray-600 mb-1">
                Email Address
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input
                    id="email"
                    type="email"
                    {...field}
                    placeholder="you@example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                  />
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-sm font-outfit mt-1">{errors.email.message}</p>
              )}
              {authErrors && (
                <p className="text-red-500 text-sm font-outfit mt-1">{authErrors}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center p-3 rounded-lg font-outfit font-semibold text-black ${isSubmitting
                  ? 'bg-yellow-300/30 cursor-not-allowed'
                  : 'bg-yellow-300/70 hover:bg-yellow-300/60'
                } transition-colors duration-200`}
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing Up...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
          <p className="font-outfit text-gray-600 text-sm text-center mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-yellow-300/70 hover:underline font-medium">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
      <div id="clerk-captcha" className="hidden" />
    </>
  );
}
