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
    throw new Error('Please sign in to update your profile.');
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
      'Failed to save influencer information.',
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
