"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  InfluencerProfilePayloadSchema,
  type InfluencerProfilePayload,
  InfluencerProfileResponseBodySchema,
} from '@/features/influencer/backend/schema';

const getAuthHeaders = async () => {
  const supabase = getSupabaseBrowserClient();
  const sessionResult = await supabase.auth.getSession();
  const token = sessionResult.data.session?.access_token;

  if (!token) {
    throw new Error('로그인이 필요한 서비스입니다.');
  }

  return {
    Authorization: `Bearer ${token}`,
  } as const;
};

const upsertInfluencerProfile = async (payload: InfluencerProfilePayload) => {
  const headers = await getAuthHeaders();
  const requestBody = InfluencerProfilePayloadSchema.parse(payload);

  try {
    const response = await apiClient.post(
      '/api/influencers/profile',
      requestBody,
      { headers },
    );

    return InfluencerProfileResponseBodySchema.parse(response.data);
  } catch (error) {
    const message = extractApiErrorMessage(
      error,
      '인플루언서 정보를 저장하지 못했습니다.',
    );
    throw new Error(message);
  }
};

export const useUpsertInfluencerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertInfluencerProfile,
    mutationKey: ['influencer', 'profile', 'upsert'],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['influencer', 'profile'] });
    },
  });
};
