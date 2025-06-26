import { z } from 'zod';

export const specialtyOptions = [
  'FULL_STACK',
  'FRONTEND',
  'BACKEND',
  'MOBILE',
  'DATA_SCIENCE',
  'DESIGNER',
  'PRODUCT_MANAGER',
  'BUSINESS',
  'OTHER',
] as const;

export const interestOptions = [
  'AR_VR',
  'BEGINNER_FRIENDLY',
  'BLOCKCHAIN',
  'COMMUNICATION',
  'CYBERSECURITY',
  'DATABASES',
  'DESIGN',
  'DEVOPS',
  'ECOMMERCE',
  'EDUCATION',
  'ENTERPRISE',
  'FINTECH',
  'GAMING',
  'HEALTH',
  'IOT',
  'LIFEHACKS',
  'NO_CODE',
  'MACHINE_LEARNING',
  'MOBILE',
  'MUSIC_ART',
  'OPEN_ENDED',
  'PRODUCTIVITY',
  'QUANTUM',
  'RPA',
  'SERVERLESS',
  'SOCIAL_GOOD',
  'VOICE_SKILLS',
  'WEB',
] as const;

export const expertProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Please Enter Name' })
    .max(50, { message: 'Maximum 50 characters only!' }),
  username: z
    .string()
    .min(4, { message: 'Minimum 4 characters required' })
    .max(20, { message: 'Maximum 20 characters only' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores.',
    }),
  email: z.string().email({ message: 'Please Enter a Valid Email Address!' }),
  profileImageUrl: z.string().url().optional(),
  skills: z.array(z.string().min(1)).min(1, { message: 'Add at least one skill' }),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters' }).optional(),
  specialty: z.enum(specialtyOptions, { message: 'Please select a specialty' }),
  interests: z
    .array(z.enum(interestOptions))
    .min(1, { message: 'Choose at least one interest' }),
  isCreatingCompany: z.boolean(),
  existingCompanyId: z.string().optional(),
  newCompany: z
    .object({
      name: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
      websiteUrl: z.string().url({ message: 'Invalid URL' }).optional(),
      description: z.string().max(500, { message: 'Description cannot exceed 500 characters' }).optional(),
      phoneNumber: z.string().min(7, { message: 'Phone number must be at least 7 digits' }),
      emailDomain: z.string().optional(),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.isCreatingCompany) {
    if (!data.newCompany?.name || !data.newCompany?.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company name and phone number are required to create a new company.',
        path: ['newCompany'],
      });
    }
  } else {
    if (!data.existingCompanyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a company to join.',
        path: ['existingCompanyId'],
      });
    }
  }
});
