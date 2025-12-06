import { z } from 'zod';

export const roleTypeValues = ['influencer', 'advertiser'] as const;
export type RoleType = (typeof roleTypeValues)[number];

export const verificationMethodValues = ['email', 'sms'] as const;
export type VerificationMethod = (typeof verificationMethodValues)[number];

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password cannot exceed 72 characters.'),
  fullName: z
    .string()
    .min(1, 'Please enter your name.')
    .max(100, 'Name cannot exceed 100 characters.'),
  phone: z
    .string()
    .min(8, 'Please enter a phone number.')
    .max(30, 'Phone number is too long.'),
  roleType: z.enum(roleTypeValues),
  verificationMethod: z.enum(verificationMethodValues),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  nextPath: z.string().min(1),
  onboardingStatus: z.literal('pending'),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

export const SignupErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
