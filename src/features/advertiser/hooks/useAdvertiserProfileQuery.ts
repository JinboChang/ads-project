"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { AdvertiserProfileResponseBodySchema } from '@/features/advertiser/backend/schema';

const getAuthHeaders = async () => {
  const supabase = getSupabaseBrowserClient();
  const sessionResult = await supabase.auth.getSession();
  const token = sessionResult.data.session?.access_token;

  if (!token) {
    throw new Error('Please sign in to view advertiser information.');
  }

  return {
    Authorization: `Bearer ${token}`,
  } as const;
};

const fetchAdvertiserProfile = async () => {
  const headers = await getAuthHeaders();
  const response = await apiClient.get('/api/advertisers/profile', { headers });

  return AdvertiserProfileResponseBodySchema.parse(response.data);
};

type UseAdvertiserProfileQueryOptions = {
  enabled?: boolean;
};

export const useAdvertiserProfileQuery = (options?: UseAdvertiserProfileQueryOptions) =>
  useQuery({
    queryKey: ['advertiser', 'profile'],
    queryFn: fetchAdvertiserProfile,
    enabled: options?.enabled,
  });
