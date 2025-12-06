"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  CampaignApplicationPayloadSchema,
  CampaignApplicationResponseSchema,
  type CampaignApplicationPayload,
  type CampaignApplicationResponse,
} from '@/features/applications/submit/backend/schema';

const getAuthHeaders = async () => {
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('Please sign in to submit an application.');
  }

  return {
    Authorization: `Bearer ${token}`,
  } as const;
};

const submitApplication = async (
  payload: CampaignApplicationPayload,
): Promise<CampaignApplicationResponse> => {
  const headers = await getAuthHeaders();
  const body = CampaignApplicationPayloadSchema.parse(payload);

  try {
    const response = await apiClient.post('/api/applications', body, { headers });
    return CampaignApplicationResponseSchema.parse(response.data);
  } catch (error) {
    const message = extractApiErrorMessage(
      error,
      'Failed to save your application.',
    );
    throw new Error(message);
  }
};

export const useSubmitApplicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitApplication,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['campaigns', 'detail', variables.campaignId],
        }),
        queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] }),
      ]);
    },
  });
};
