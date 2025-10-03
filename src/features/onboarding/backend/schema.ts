import { z } from 'zod';
import {
  SignupRequestSchema,
  SignupResponseSchema,
} from '@/features/onboarding/lib/dto';

export const SignupPayloadSchema = SignupRequestSchema;
export const SignupResultSchema = SignupResponseSchema;

export type SignupPayload = z.infer<typeof SignupPayloadSchema>;
export type SignupResult = z.infer<typeof SignupResultSchema>;
