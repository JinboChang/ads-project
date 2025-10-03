"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { InfluencerProfileResponseSchema } from '@/features/influencer/lib/dto';

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

const fetchInfluencerProfile = async () => {
  const headers = await getAuthHeaders();
  const response = await apiClient.get('/api/influencers/profile', {
    headers,
  });

  return InfluencerProfileResponseSchema.parse(response.data);
};

export const useInfluencerProfileQuery = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['influencer', 'profile'],
    queryFn: fetchInfluencerProfile,
    ...options,
  });
