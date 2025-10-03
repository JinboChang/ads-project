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
  .url({ message: '올바른 URL을 입력해주세요.' })
  .refine((value) => value.startsWith('https://'), {
    message: '채널 URL은 https://로 시작해야 합니다.',
  });

export const InfluencerChannelInputSchema = z.object({
  platform: z.enum(channelPlatformValues, {
    required_error: '채널 플랫폼을 선택해주세요.',
  }),
  channelName: z
    .string()
    .min(1, '채널 이름을 입력해주세요.')
    .max(200, '채널 이름은 200자를 초과할 수 없습니다.'),
  channelUrl: httpsUrlSchema,
  audienceSize: z
    .number({ invalid_type_error: '구독자 수는 숫자로 입력해주세요.' })
    .int('구독자 수는 정수로 입력해주세요.')
    .positive('구독자 수는 1 이상의 값이어야 합니다.')
    .max(1_000_000_000, '구독자 수는 10억 이하로 입력해주세요.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  uploadFrequency: z.enum(uploadFrequencyValues, {
    required_error: '주요 업로드 빈도를 선택해주세요.',
  }),
});

export type InfluencerChannelInput = z.infer<typeof InfluencerChannelInputSchema>;

export const InfluencerProfileInputSchema = z.object({
  birthDate: z
    .string({ required_error: '생년월일을 입력해주세요.' })
    .min(1, '생년월일을 입력해주세요.'),
  channels: z
    .array(InfluencerChannelInputSchema)
    .min(1, '최소 1개 이상의 채널을 등록해주세요.'),
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
