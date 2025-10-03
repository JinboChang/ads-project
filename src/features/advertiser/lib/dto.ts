import { z } from 'zod';

export const advertiserVerificationStatusValues = [
  'pending',
  'approved',
  'rejected',
] as const;

export type AdvertiserVerificationStatus =
  (typeof advertiserVerificationStatusValues)[number];

const businessRegistrationNumberSchema = z
  .string({ required_error: '사업자등록번호를 입력해주세요.' })
  .regex(/^\d{10}$/u, '사업자등록번호는 하이픈 없이 10자리 숫자로 입력해주세요.');

export const AdvertiserProfileInputSchema = z.object({
  companyName: z
    .string({ required_error: '업체명을 입력해주세요.' })
    .min(1, '업체명을 입력해주세요.')
    .max(200, '업체명은 200자를 초과할 수 없습니다.'),
  location: z
    .string({ required_error: '위치를 입력해주세요.' })
    .min(1, '위치를 입력해주세요.')
    .max(200, '위치는 200자를 초과할 수 없습니다.'),
  businessCategory: z
    .string({ required_error: '카테고리를 입력해주세요.' })
    .min(1, '카테고리를 입력해주세요.')
    .max(100, '카테고리는 100자를 초과할 수 없습니다.'),
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
