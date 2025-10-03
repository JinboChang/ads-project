import { z } from 'zod';

export const roleTypeValues = ['influencer', 'advertiser'] as const;
export type RoleType = (typeof roleTypeValues)[number];

export const verificationMethodValues = ['email', 'sms'] as const;
export type VerificationMethod = (typeof verificationMethodValues)[number];

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(72, '비밀번호는 72자를 초과할 수 없습니다.'),
  fullName: z
    .string()
    .min(1, '이름을 입력해주세요.')
    .max(100, '이름은 100자를 초과할 수 없습니다.'),
  phone: z
    .string()
    .min(8, '휴대폰 번호를 입력해주세요.')
    .max(30, '휴대폰 번호가 너무 깁니다.'),
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
