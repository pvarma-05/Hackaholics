
import { z } from 'zod';

export const HackathonReviewType = z.enum(['MANUAL', 'AI']);
export const HackathonStatus = z.enum([
  'UPCOMING',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'JUDGING',
  'COMPLETED',
  'ARCHIVED',
]);

export const hackathonFormSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  rules: z.string().optional(),

  bannerImageUrl: z.string().url('Invalid image URL').optional(),

  startDate: z.string().min(1, 'Start Date is required'),
  endDate: z.string().min(1, 'End Date is required'),
  registrationEndDate: z.string().min(1, 'Registration End Date is required'),
  submissionEndDate: z.string().min(1, 'Submission End Date is required'),
  reviewType: HackathonReviewType,
  companyId: z.string().optional(),
}).superRefine((data, ctx) => {

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const registrationEndDate = new Date(data.registrationEndDate);
  const submissionEndDate = new Date(data.submissionEndDate);

  if (isNaN(startDate.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid Start Date format', path: ['startDate'] });
  }
  if (isNaN(endDate.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid End Date format', path: ['endDate'] });
  }
  if (isNaN(registrationEndDate.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid Registration End Date format', path: ['registrationEndDate'] });
  }
  if (isNaN(submissionEndDate.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid Submission End Date format', path: ['submissionEndDate'] });
  }

  if (startDate >= endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date must be after start date.',
      path: ['endDate'],
    });
  }
  if (registrationEndDate >= startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Registration must close before the hackathon starts.',
      path: ['registrationEndDate'],
    });
  }
  if (submissionEndDate <= registrationEndDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Submission deadline must be after registration closes.',
      path: ['submissionEndDate'],
    });
  }
  if (submissionEndDate >= endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Submission deadline must be before hackathon end date.',
      path: ['submissionEndDate'],
    });
  }
});

export type HackathonFormData = z.infer<typeof hackathonFormSchema>;
