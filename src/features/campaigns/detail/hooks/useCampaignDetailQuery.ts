"use client";

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  CampaignDetailResponseSchema,
  type CampaignDetailResponse,
} from '@/features/campaigns/lib/dto';

const getAuthHeaders = async () => {
  const supabase = getSupabaseBrowserClient();
  const sessionResult = await supabase.auth.getSession();
  const token = sessionResult.data.session?.access_token;

  if (!token) {
    return {} as const;
  }

  return {
    Authorization: `Bearer ${token}`,
  } as const;
};

const fetchCampaignDetail = async (campaignId: number) => {
  const headers = await getAuthHeaders();
  const response = await apiClient.get(`/api/campaigns/${campaignId}`, {
    headers,
  });

  return CampaignDetailResponseSchema.parse(response.data);
};

export const useCampaignDetailQuery = (
  campaignId: number | null,
): UseQueryResult<CampaignDetailResponse, Error> =>
  useQuery({
    queryKey: ['campaigns', 'detail', campaignId],
    queryFn: () => {
      if (!campaignId || !Number.isFinite(campaignId) || campaignId <= 0) {
        throw new Error('Invalid campaign ID.');
      }
      return fetchCampaignDetail(campaignId);
    },
    enabled: typeof campaignId === 'number' && Number.isFinite(campaignId) && campaignId > 0,
  });
