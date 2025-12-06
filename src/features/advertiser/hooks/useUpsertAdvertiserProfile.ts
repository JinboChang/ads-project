"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  AdvertiserProfilePayloadSchema,
  type AdvertiserProfilePayload,
  AdvertiserProfileResponseBodySchema,
} from '@/features/advertiser/backend/schema';

const getAuthHeaders = async () => {
  const supabase = getSupabaseBrowserClient();
  const sessionResult = await supabase.auth.getSession();
  const token = sessionResult.data.session?.access_token;

  if (!token) {
    throw new Error('Please sign in to update advertiser information.');
  }

  return {
    Authorization: `Bearer ${token}`,
  } as const;
};

const upsertAdvertiserProfile = async (payload: AdvertiserProfilePayload) => {
  const headers = await getAuthHeaders();
  const body = AdvertiserProfilePayloadSchema.parse(payload);

  try {
    const response = await apiClient.post(
      '/api/advertisers/profile',
      body,
      { headers },
    );

    return AdvertiserProfileResponseBodySchema.parse(response.data);
  } catch (error) {
    const message = extractApiErrorMessage(
      error,
      'Failed to save advertiser information.',
    );
    throw new Error(message);
  }
};

export const useUpsertAdvertiserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['advertiser', 'profile', 'upsert'],
    mutationFn: upsertAdvertiserProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['advertiser', 'profile'] });
    },
  });
};
