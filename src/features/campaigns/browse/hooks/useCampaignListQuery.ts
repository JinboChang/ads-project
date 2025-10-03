"use client";

import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  CampaignListResponseSchema,
  type CampaignListResponse,
} from '@/features/campaigns/lib/dto';
import { useCampaignFilterStore } from '@/features/campaigns/browse/hooks/useCampaignFilters';

const fetchCampaigns = async (params: Record<string, unknown>) => {
  const response = await apiClient.get('/api/campaigns', { params });
  return CampaignListResponseSchema.parse(response.data);
};

export const useCampaignListQuery = (): UseQueryResult<CampaignListResponse, Error> => {
  const { status, sort, category, location, page, pageSize } =
    useCampaignFilterStore((state) => ({
      status: state.status,
      sort: state.sort,
      category: state.category,
      location: state.location,
      page: state.page,
      pageSize: state.pageSize,
    }));

  const params = useMemo(
    () => ({
      ...(status !== 'all' ? { status } : {}),
      sort,
      ...(category ? { category } : {}),
      ...(location ? { location } : {}),
      page,
      pageSize,
    }),
    [status, sort, category, location, page, pageSize],
  );

  return useQuery<CampaignListResponse, Error>({
    queryKey: ['campaigns', 'list', params],
    queryFn: () => fetchCampaigns(params),
  });
};
