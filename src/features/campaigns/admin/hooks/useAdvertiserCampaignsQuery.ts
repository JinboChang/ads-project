"use client";

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient, isAxiosError } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  AdvertiserCampaignListResponseSchema,
  campaignStatusValues,
  type AdvertiserCampaignListResponse,
  type CampaignStatus,
} from '@/features/campaigns/lib/dto';
import { queryKeys } from '@/lib/react-query/queryKeys';
import { advertiserCampaignsApiPath } from '@/features/campaigns/admin/constants';

export type AdvertiserCampaignsQueryParams = {
  status?: CampaignStatus | null;
};

const statusSet = new Set<CampaignStatus>(campaignStatusValues);

const buildQueryString = (params?: AdvertiserCampaignsQueryParams) => {
  if (!params?.status || !statusSet.has(params.status)) {
    return '';
  }

  const searchParams = new URLSearchParams();
  searchParams.set('status', params.status);
  return '?' + searchParams.toString();
};

const fetchAdvertiserCampaigns = async (
  params?: AdvertiserCampaignsQueryParams,
) => {
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('로그인이 필요한 서비스입니다.');
  }

  const query = buildQueryString(params);

  try {
    const response = await apiClient.get(
      advertiserCampaignsApiPath + query,
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    );

    return AdvertiserCampaignListResponseSchema.parse(response.data);
  } catch (error) {
    if (isAxiosError(error)) {
      const payload = error.response?.data as {
        error?: { code?: string; message?: string };
      } | null;
      const message =
        typeof payload?.error?.message === 'string'
          ? payload.error.message
          : '체험단 목록을 불러오지 못했습니다.';
      const enrichedError = new Error(message) as Error & {
        code?: string;
        status?: number;
      };
      if (payload?.error?.code) {
        enrichedError.code = payload.error.code;
      }
      if (typeof error.response?.status === 'number') {
        enrichedError.status = error.response.status;
      }
      throw enrichedError;
    }

    const fallbackError = new Error('체험단 목록을 불러오지 못했습니다.');
    throw fallbackError;
  }
};

export const useAdvertiserCampaignsQuery = (
  params?: AdvertiserCampaignsQueryParams,
  options?: { enabled?: boolean },
): UseQueryResult<AdvertiserCampaignListResponse, Error> =>
  useQuery({
    queryKey: queryKeys.campaigns.advertiser.list(params ?? {}),
    queryFn: () => fetchAdvertiserCampaigns(params),
    enabled: options?.enabled,
  });
