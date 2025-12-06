import { z } from 'zod';

export const influencerVerificationStatusValues = [
  'pending',
  'approved',
  'rejected',
] as const;

export type InfluencerVerificationStatus =
  (typeof influencerVerificationStatusValues)[number];

export const channelPlatformValues = [
  'youtube',
  'instagram',
  'naver',
  'threads',
  'tiktok',
] as const;

export type ChannelPlatform = (typeof channelPlatformValues)[number];

export const uploadFrequencyValues = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'occasionally',
] as const;

export type UploadFrequency = (typeof uploadFrequencyValues)[number];

const httpsUrlSchema = z
  .string()
  .url({ message: 'Please enter a valid URL.' })
  .refine((value) => value.startsWith('https://'), {
    message: 'Channel URL must start with https://.',
  });

export const InfluencerChannelInputSchema = z.object({
  platform: z.enum(channelPlatformValues, {
    required_error: 'Please select a channel platform.',
  }),
  channelName: z
    .string()
    .min(1, 'Please enter a channel name.')
    .max(200, 'Channel name cannot exceed 200 characters.'),
  channelUrl: httpsUrlSchema,
  audienceSize: z
    .number({ invalid_type_error: 'Subscribers must be a number.' })
    .int('Subscribers must be an integer.')
    .positive('Subscribers must be at least 1.')
    .max(1_000_000_000, 'Subscribers must be 1 billion or less.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  uploadFrequency: z.enum(uploadFrequencyValues, {
    required_error: 'Please select an upload frequency.',
  }),
});

export type InfluencerChannelInput = z.infer<typeof InfluencerChannelInputSchema>;

export const InfluencerProfileInputSchema = z.object({
  birthDate: z
    .string({ required_error: 'Please enter your date of birth.' })
    .min(1, 'Please enter your date of birth.'),
  channels: z
    .array(InfluencerChannelInputSchema)
    .min(1, 'Register at least one channel.'),
});

export type InfluencerProfileInput = z.infer<typeof InfluencerProfileInputSchema>;

export const InfluencerChannelResponseSchema = z.object({
  id: z.number().int(),
  platform: z.enum(channelPlatformValues),
  channelName: z.string(),
  channelUrl: z.string(),
  audienceSize: z.number().int().nullable(),
  verificationStatus: z.enum(influencerVerificationStatusValues),
  lastVerifiedAt: z.string().nullable(),
  uploadFrequency: z.enum(uploadFrequencyValues),
});

export type InfluencerChannelResponse = z.infer<
  typeof InfluencerChannelResponseSchema
>;

export const InfluencerProfileResponseSchema = z.object({
  onboardingStatus: z.enum(['pending', 'completed']),
  birthDate: z.string().nullable(),
  verificationStatus: z.enum(influencerVerificationStatusValues),
  verificationNotes: z.string().nullable(),
  channels: z.array(InfluencerChannelResponseSchema),
});

export type InfluencerProfileResponse = z.infer<
  typeof InfluencerProfileResponseSchema
>;
