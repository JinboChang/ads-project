'use client';

import { useMutation } from '@tanstack/react-query';
import {
  SignupRequestSchema,
  SignupResponseSchema,
  type SignupRequest,
  type SignupResponse,
} from '@/features/onboarding/lib/dto';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

const postSignup = async (payload: SignupRequest): Promise<SignupResponse> => {
  const parsedPayload = SignupRequestSchema.parse(payload);

  try {
    const { data } = await apiClient.post('/api/onboarding/signup', parsedPayload);

    return SignupResponseSchema.parse(data);
  } catch (error) {
    const fallbackMessage = '회원가입에 실패했습니다.';
    const message = extractApiErrorMessage(error, fallbackMessage);
    throw new Error(message);
  }
};

export const useSignupMutation = () =>
  useMutation({
    mutationKey: ['auth', 'signup'],
    mutationFn: postSignup,
  });
