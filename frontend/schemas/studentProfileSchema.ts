import { z } from "zod";

export const studentProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Please Enter Name" })
      .max(50, { message: "Maximum 50 characters only!" }),
    username: z
      .string()
      .min(4, { message: "Minimum 4 characters required" })
      .max(20, { message: "Maximum 20 characters only" })
      .regex(/^[a-zA-Z0-9_]+$/,
        {
          message: 'Username can only contain letters, numbers, and underscores.',
        }),
    email: z.string().email(),
    profileImageUrl: z.string().url().optional(),
    specialty: z.enum([
      'FULL_STACK', 'FRONTEND', 'BACKEND', 'MOBILE',
      'DATA_SCIENCE', 'DESIGNER', 'PRODUCT_MANAGER', 'BUSINESS', 'OTHER',
    ]),
    skills: z.array(z.string().min(1)).min(1, 'Please add at least one skill'),
    bio: z.string().max(500).optional(),
    interests: z.array(z.enum([
      'AR_VR', 'BEGINNER_FRIENDLY', 'BLOCKCHAIN', 'COMMUNICATION',
      'CYBERSECURITY', 'DATABASES', 'DESIGN', 'DEVOPS', 'ECOMMERCE',
      'EDUCATION', 'ENTERPRISE', 'FINTECH', 'GAMING', 'HEALTH', 'IOT',
      'LIFEHACKS', 'NO_CODE', 'MACHINE_LEARNING', 'MOBILE', 'MUSIC_ART',
      'OPEN_ENDED', 'PRODUCTIVITY', 'QUANTUM', 'RPA', 'SERVERLESS',
      'SOCIAL_GOOD', 'VOICE_SKILLS', 'WEB'
    ])).min(1, 'Choose at least one interest'),
    location: z.string().min(2),
    timezone: z.string().min(2),

    occupation: z.enum(['STUDENT', 'PROFESSIONAL']),
    studentLevel: z.enum(['COLLEGE', 'HIGH_SCHOOL', 'MIDDLE_SCHOOL']),
    schoolName: z.string().min(2),
    graduationMonth: z.enum([
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ]),
    graduationYear: z.number().min(2024).max(2100),
    birthMonth: z.number().min(1).max(12),
    birthYear: z.number().min(1950).max(new Date().getFullYear() - 12),
  });
