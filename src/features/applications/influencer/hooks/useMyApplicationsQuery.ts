"use client";

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  MyApplicationsResponseSchema,
  type MyApplicationStatusFilter,
  type MyApplicationsResponse,
} from '@/features/applications/lib/dto';
import { queryKeys } from '@/lib/react-query/queryKeys';

type UseMyApplicationsQueryOptions = {
  enabled?: boolean;
};

const buildQueryString = (status: MyApplicationStatusFilter) => {
  if (status === 'all') {
    return '';
  }

  const params = new URLSearchParams();
  params.set('status', status);
  return '?' + params.toString();
};

const fetchMyApplications = async (status: MyApplicationStatusFilter) => {
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('로그인이 필요한 서비스입니다.');
  }

  const query = buildQueryString(status);
  const response = await apiClient.get('/api/influencers/applications' + query, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });

  return MyApplicationsResponseSchema.parse(response.data);
};

export const useMyApplicationsQuery = (
  status: MyApplicationStatusFilter,
  options?: UseMyApplicationsQueryOptions,
): UseQueryResult<MyApplicationsResponse, Error> =>
  useQuery({
    queryKey: queryKeys.applications.mine({ status }),
    queryFn: () => fetchMyApplications(status),
    enabled: options?.enabled ?? true,
  });
