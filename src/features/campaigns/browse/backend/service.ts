import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import {
  campaignBrowseErrorCodes,
  type CampaignBrowseErrorCode,
} from '@/features/campaigns/browse/backend/error';
import type {
  CampaignListQuery,
} from '@/features/campaigns/browse/backend/schema';
import type {
  CampaignListResponse,
  CampaignSummary,
  CampaignStatus,
} from '@/features/campaigns/lib/dto';

const DEFAULT_STATUS: CampaignStatus = 'recruiting';

const buildFilterValue = (value?: string) =>
  value && value.trim().length > 0 ? value.trim() : undefined;

export const listCampaigns = async (
  supabase: SupabaseClient,
  query: CampaignListQuery,
) => {
  const status = query.status ?? DEFAULT_STATUS;
  const sort = query.sort ?? 'recent';
  const location = buildFilterValue(query.location);
  const category = buildFilterValue(query.category);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from('campaigns')
    .select(
      'id, title, benefit_summary, store_location, status, application_start_at, application_end_at, max_participants, created_at',
      { count: 'exact', head: false },
    );

  if (status) {
    request = request.eq('status', status);
  }

  if (location) {
    request = request.ilike('store_location', `%${location}%`);
  }

  if (category) {
    request = request.ilike('benefit_summary', `%${category}%`);
  }

  if (sort === 'endingSoon') {
    request = request
      .order('application_end_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
  } else {
    request = request.order('created_at', { ascending: false });
  }

  request = request.range(from, to);

  const result = await request;

  if (result.error) {
    return failure(
      500,
      campaignBrowseErrorCodes.supabaseFailure,
      '체험단 목록을 불러오지 못했습니다.',
      result.error.message,
    );
  }

  const items: CampaignSummary[] = (result.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    benefitSummary: row.benefit_summary,
    storeLocation: row.store_location,
    status: row.status,
    applicationStartAt: row.application_start_at,
    applicationEndAt: row.application_end_at,
    maxParticipants: row.max_participants,
    createdAt: row.created_at,
  }));

  const totalCount = result.count ?? 0;
  const hasMore = to + 1 < totalCount;

  const response: CampaignListResponse = {
    items,
    meta: {
      page,
      pageSize,
      totalCount,
      hasMore,
    },
  };

  return success(response, 200);
};

export type CampaignBrowseServiceError = CampaignBrowseErrorCode;
