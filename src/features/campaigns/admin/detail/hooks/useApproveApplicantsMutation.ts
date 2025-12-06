"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  ApproveApplicantsRequestSchema,
  type ApproveApplicantsRequest,
} from "@/features/campaigns/lib/dto";
import {
  CampaignWorkflowResultSchema,
  type CampaignWorkflowResult,
} from "@/features/campaigns/admin/detail/backend/schema";
import { buildAdvertiserCampaignApprovePath } from "@/features/campaigns/admin/constants";
import { queryKeys } from "@/lib/react-query/queryKeys";

const approveApplicantsRequest = async (
  campaignId: number,
  input: ApproveApplicantsRequest,
) => {
  const payload = ApproveApplicantsRequestSchema.parse(input);
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("Please sign in to manage applicants.");
  }

  try {
    const response = await apiClient.post(
      buildAdvertiserCampaignApprovePath(campaignId),
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return CampaignWorkflowResultSchema.parse(response.data);
  } catch (error) {
    const message = extractApiErrorMessage(error, "Failed to approve applicants.");
    throw new Error(message);
  }
};

export const useApproveApplicantsMutation = (
  campaignId: number,
): UseMutationResult<CampaignWorkflowResult, Error, ApproveApplicantsRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.campaigns.advertiser.approve(campaignId),
    mutationFn: (input) => approveApplicantsRequest(campaignId, input),
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
