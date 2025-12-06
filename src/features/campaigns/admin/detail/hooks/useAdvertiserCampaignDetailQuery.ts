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
    throw new Error("Please sign in to view this campaign.");
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
          : "Failed to load campaign details.";
      throw new Error(message);
    }

    throw new Error("Failed to load campaign details.");
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
        throw new Error("Invalid campaign ID.");
      }

      return fetchAdvertiserCampaignDetail(campaignId);
    },
    enabled:
      (options?.enabled ?? true) && typeof campaignId === "number" && Number.isFinite(campaignId),
  });
