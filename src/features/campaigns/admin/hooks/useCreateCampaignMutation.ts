"use client";

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  AdvertiserCampaignCreateInputSchema,
  AdvertiserCampaignSummarySchema,
  type AdvertiserCampaignCreateInput,
  type AdvertiserCampaignSummary,
} from '@/features/campaigns/lib/dto';
import { advertiserCampaignsApiPath } from '@/features/campaigns/admin/constants';
import { queryKeys } from '@/lib/react-query/queryKeys';

const createCampaign = async (input: AdvertiserCampaignCreateInput) => {
  const payload = AdvertiserCampaignCreateInputSchema.parse(input);
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('로그인이 필요한 서비스입니다.');
  }

  try {
    const response = await apiClient.post(
      advertiserCampaignsApiPath,
      payload,
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    );

    return AdvertiserCampaignSummarySchema.parse(response.data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '체험단을 생성하지 못했습니다.');
    throw new Error(message);
  }
};

export const useCreateCampaignMutation = (): UseMutationResult<
  AdvertiserCampaignSummary,
  Error,
  AdvertiserCampaignCreateInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.campaigns.advertiser.create,
    mutationFn: createCampaign,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.advertiser.base,
      });
    },
  });
};
