"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  ReopenCampaignRequestSchema,
  type ReopenCampaignRequest,
} from "@/features/campaigns/lib/dto";
import {
  CampaignWorkflowResultSchema,
  type CampaignWorkflowResult,
} from "@/features/campaigns/admin/detail/backend/schema";
import { buildAdvertiserCampaignReopenPath } from "@/features/campaigns/admin/constants";
import { queryKeys } from "@/lib/react-query/queryKeys";

const reopenCampaignRequest = async (
  campaignId: number,
  input: ReopenCampaignRequest,
) => {
  const payload = ReopenCampaignRequestSchema.parse(input ?? {});
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("로그인이 필요한 서비스입니다.");
  }

  try {
    const response = await apiClient.post(
      buildAdvertiserCampaignReopenPath(campaignId),
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return CampaignWorkflowResultSchema.parse(response.data);
  } catch (error) {
    const message = extractApiErrorMessage(error, "모집 재시작에 실패했습니다.");
    throw new Error(message);
  }
};

export const useReopenCampaignMutation = (
  campaignId: number,
): UseMutationResult<CampaignWorkflowResult, Error, ReopenCampaignRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.campaigns.advertiser.reopen(campaignId),
    mutationFn: (input) => reopenCampaignRequest(campaignId, input ?? {}),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.campaigns.advertiser.detail(campaignId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.campaigns.advertiser.base,
        }),
      ]);
    },
  });
};
