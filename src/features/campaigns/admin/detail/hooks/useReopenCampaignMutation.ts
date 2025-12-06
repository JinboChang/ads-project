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
    throw new Error("Please sign in to manage this campaign.");
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
    const message = extractApiErrorMessage(error, "Failed to reopen the campaign.");
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
