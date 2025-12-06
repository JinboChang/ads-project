import { z } from 'zod';

export const advertiserVerificationStatusValues = [
  'pending',
  'approved',
  'rejected',
] as const;

export type AdvertiserVerificationStatus =
  (typeof advertiserVerificationStatusValues)[number];

const businessRegistrationNumberSchema = z
  .string({ required_error: 'Please enter a business registration number.' })
  .regex(/^\d{10}$/u, 'The business registration number must be 10 digits without hyphens.');

export const AdvertiserProfileInputSchema = z.object({
  companyName: z
    .string({ required_error: 'Please enter the company name.' })
    .min(1, 'Please enter the company name.')
    .max(200, 'Company name cannot exceed 200 characters.'),
  location: z
    .string({ required_error: 'Please enter a location.' })
    .min(1, 'Please enter a location.')
    .max(200, 'Location cannot exceed 200 characters.'),
  businessCategory: z
    .string({ required_error: 'Please enter a category.' })
    .min(1, 'Please enter a category.')
    .max(100, 'Category cannot exceed 100 characters.'),
  businessRegistrationNumber: businessRegistrationNumberSchema,
});

export type AdvertiserProfileInput = z.infer<typeof AdvertiserProfileInputSchema>;

export const AdvertiserProfileResponseSchema = z.object({
  companyName: z.string().nullable(),
  location: z.string().nullable(),
  businessCategory: z.string().nullable(),
  businessRegistrationNumber: z.string().nullable(),
  verificationStatus: z.enum(advertiserVerificationStatusValues),
  verificationNotes: z.string().nullable(),
});

export type AdvertiserProfileResponse = z.infer<
  typeof AdvertiserProfileResponseSchema
>;
