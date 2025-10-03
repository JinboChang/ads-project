"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiClient, isAxiosError } from "@/lib/remote/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  AdvertiserCampaignDetailResponseSchema,
  type AdvertiserCampaignDetailResponse,
} from "@/features/campaigns/admin/detail/backend/schema";
import { buildAdvertiserCampaignDetailPath } from "@/features/campaigns/admin/constants";
import { queryKeys } from "@/lib/react-query/queryKeys";

const fetchAdvertiserCampaignDetail = async (campaignId: number) => {
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("로그인이 필요한 서비스입니다.");
  }

  const path = buildAdvertiserCampaignDetailPath(campaignId);

  try {
    const response = await apiClient.get(path, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return AdvertiserCampaignDetailResponseSchema.parse(response.data);
  } catch (error) {
    if (isAxiosError(error)) {
      const payload = error.response?.data as {
        error?: { message?: string };
      } | null;
      const message =
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : "체험단 상세 정보를 불러오지 못했습니다.";
      throw new Error(message);
    }

    throw new Error("체험단 상세 정보를 불러오지 못했습니다.");
  }
};

export const useAdvertiserCampaignDetailQuery = (
  campaignId: number | null,
  options?: { enabled?: boolean },
): UseQueryResult<AdvertiserCampaignDetailResponse, Error> =>
  useQuery({
    queryKey: queryKeys.campaigns.advertiser.detail(campaignId ?? "unknown"),
    queryFn: () => {
      if (!campaignId || !Number.isFinite(campaignId)) {
        throw new Error("유효하지 않은 체험단 ID입니다.");
      }

      return fetchAdvertiserCampaignDetail(campaignId);
    },
    enabled:
      (options?.enabled ?? true) && typeof campaignId === "number" && Number.isFinite(campaignId),
  });
