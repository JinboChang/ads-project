import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  AdvertiserCampaignCreateInput,
  AdvertiserCampaignListResponse,
  AdvertiserCampaignSummary,
  campaignStatusValues,
  type AdvertiserCampaignStats,
  type CampaignStatus,
} from '@/features/campaigns/lib/dto';
import {
  advertiserCampaignAdminErrorCodes,
  type AdvertiserCampaignAdminErrorCode,
} from '@/features/campaigns/admin/backend/error';
import { fetchCampaignStatsMap, resetCampaignStats } from '@/features/campaigns/admin/backend/stats-service';

const ADVERTISER_PROFILES_TABLE = 'advertiser_profiles';
const CAMPAIGNS_TABLE = 'campaigns';

const DEFAULT_CAMPAIGN_STATUS: CampaignStatus = 'recruiting';

const campaignStatusSet = new Set(campaignStatusValues);

const createEmptyStats = (): AdvertiserCampaignStats => resetCampaignStats();

type AdvertiserProfileRow = {
  verification_status: 'pending' | 'approved' | 'rejected';
};

type CampaignRow = {
  id: number;
  advertiser_id: string;
  title: string;
  benefit_summary: string | null;
  mission_details: string | null;
  store_location: string | null;
  status: CampaignStatus;
  application_start_at: string;
  application_end_at: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
};

const ensureCampaignStatus = (status: string): CampaignStatus => {
  if (campaignStatusSet.has(status as CampaignStatus)) {
    return status as CampaignStatus;
  }

  return DEFAULT_CAMPAIGN_STATUS;
};

const mapCampaignRow = (
  row: CampaignRow,
  stats: AdvertiserCampaignStats,
): AdvertiserCampaignSummary => ({
  id: row.id,
  title: row.title,
  benefitSummary: row.benefit_summary,
  missionDetails: row.mission_details,
  storeLocation: row.store_location,
  status: ensureCampaignStatus(row.status),
  applicationStartAt: row.application_start_at,
  applicationEndAt: row.application_end_at,
  maxParticipants: row.max_participants,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  stats,
});

const fetchAdvertiserProfile = async (supabase: SupabaseClient, userId: string) =>
  supabase
    .from(ADVERTISER_PROFILES_TABLE)
    .select('verification_status')
    .eq('advertiser_id', userId)
    .maybeSingle<AdvertiserProfileRow>();

const fetchCampaignRows = async (
  supabase: SupabaseClient,
  userId: string,
  status?: CampaignStatus,
) => {
  const query = supabase
    .from(CAMPAIGNS_TABLE)
    .select(
      'id, advertiser_id, title, benefit_summary, mission_details, store_location, status, application_start_at, application_end_at, max_participants, created_at, updated_at',
    )
    .eq('advertiser_id', userId)
    .order('status', { ascending: true })
    .order('updated_at', { ascending: false });

  if (status) {
    query.eq('status', status);
  }

  return query.returns<CampaignRow[]>();
};

const checkDuplicateCampaign = async (
  supabase: SupabaseClient,
  userId: string,
  payload: AdvertiserCampaignCreateInput,
) =>
  supabase
    .from(CAMPAIGNS_TABLE)
    .select('id')
    .eq('advertiser_id', userId)
    .eq('title', payload.title)
    .eq('application_start_at', payload.applicationStartAt)
    .eq('application_end_at', payload.applicationEndAt)
    .maybeSingle<{ id: number }>();

const insertCampaign = async (
  supabase: SupabaseClient,
  userId: string,
  payload: AdvertiserCampaignCreateInput,
) =>
  supabase
    .from(CAMPAIGNS_TABLE)
    .insert({
      advertiser_id: userId,
      title: payload.title,
      benefit_summary: payload.benefitSummary,
      mission_details: payload.missionDetails,
      store_location: payload.storeLocation ?? null,
      application_start_at: payload.applicationStartAt,
      application_end_at: payload.applicationEndAt,
      max_participants: payload.maxParticipants,
      status: DEFAULT_CAMPAIGN_STATUS,
    })
    .select(
      'id, advertiser_id, title, benefit_summary, mission_details, store_location, status, application_start_at, application_end_at, max_participants, created_at, updated_at',
    )
    .maybeSingle<CampaignRow>();

export const listAdvertiserCampaigns = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  status?: CampaignStatus,
) => {
  const profileResult = await fetchAdvertiserProfile(supabase, userId);

  if (profileResult.error) {
    logger.error('Failed to fetch advertiser profile', profileResult.error);
    return failure<AdvertiserCampaignAdminErrorCode>(
      500,
      advertiserCampaignAdminErrorCodes.supabaseFailure,
      '광고주 정보를 확인하지 못했습니다.',
      profileResult.error.message,
    );
  }

  if (!profileResult.data) {
    return failure<AdvertiserCampaignAdminErrorCode>(
      403,
      advertiserCampaignAdminErrorCodes.forbidden,
      '광고주 전용 기능입니다.',
    );
  }

  if (profileResult.data.verification_status !== 'approved') {
    return failure<AdvertiserCampaignAdminErrorCode>(
      403,
      advertiserCampaignAdminErrorCodes.profileUnverified,
      '광고주 프로필 검증이 완료된 이후에 이용 가능합니다.',
    );
  }

  const campaignsResult = await fetchCampaignRows(
    supabase,
    userId,
    status ?? undefined,
  );

  if (campaignsResult.error) {
    logger.error('Failed to fetch advertiser campaigns', campaignsResult.error);
    return failure<AdvertiserCampaignAdminErrorCode>(
      500,
      advertiserCampaignAdminErrorCodes.supabaseFailure,
      '체험단 목록을 불러오지 못했습니다.',
      campaignsResult.error.message,
    );
  }

  const campaignRows = campaignsResult.data ?? [];
  const campaignIds = campaignRows.map((row) => row.id);

  let statsMap: Map<number, AdvertiserCampaignStats>;

  try {
    statsMap = await fetchCampaignStatsMap(supabase, campaignIds);
  } catch (error) {
    logger.error('Failed to aggregate campaign stats', error);
    return failure<AdvertiserCampaignAdminErrorCode>(
      500,
      advertiserCampaignAdminErrorCodes.supabaseFailure,
      '체험단 통계를 계산하지 못했습니다.',
      error instanceof Error ? error.message : undefined,
    );
  }

  const items: AdvertiserCampaignSummary[] = campaignRows.map((row) =>
    mapCampaignRow(row, statsMap.get(row.id) ?? createEmptyStats()),
  );

  const response: AdvertiserCampaignListResponse = {
    items,
  };

  return success(response, 200);
};

export const createAdvertiserCampaign = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  payload: AdvertiserCampaignCreateInput,
) => {
  const profileResult = await fetchAdvertiserProfile(supabase, userId);

  if (profileResult.error) {
    logger.error('Failed to fetch advertiser profile for creation', profileResult.error);
    return failure<AdvertiserCampaignAdminErrorCode>(
      500,
      advertiserCampaignAdminErrorCodes.supabaseFailure,
      '광고주 정보를 확인하지 못했습니다.',
      profileResult.error.message,
    );
  }

  if (!profileResult.data) {
    return failure<AdvertiserCampaignAdminErrorCode>(
      403,
      advertiserCampaignAdminErrorCodes.forbidden,
      '광고주 전용 기능입니다.',
    );
  }

  if (profileResult.data.verification_status !== 'approved') {
    return failure<AdvertiserCampaignAdminErrorCode>(
      403,
      advertiserCampaignAdminErrorCodes.profileUnverified,
      '광고주 프로필 검증이 완료된 이후에 이용 가능합니다.',
    );
  }

  const duplicateResult = await checkDuplicateCampaign(supabase, userId, payload);

  if (duplicateResult.error && duplicateResult.error.code !== 'PGRST116') {
    logger.error('Failed to validate duplicate campaign', duplicateResult.error);
    return failure<AdvertiserCampaignAdminErrorCode>(
      500,
      advertiserCampaignAdminErrorCodes.supabaseFailure,
      '체험단 정보를 확인하지 못했습니다.',
      duplicateResult.error.message,
    );
  }

  if (duplicateResult.data) {
    return failure<AdvertiserCampaignAdminErrorCode>(
      409,
      advertiserCampaignAdminErrorCodes.duplicateCampaign,
      '동일한 모집 기간과 제목의 체험단이 이미 존재합니다.',
    );
  }

  const insertResult = await insertCampaign(supabase, userId, payload);

  if (insertResult.error) {
    logger.error('Failed to create advertiser campaign', insertResult.error);
    return failure<AdvertiserCampaignAdminErrorCode>(
      500,
      advertiserCampaignAdminErrorCodes.supabaseFailure,
      '체험단을 생성하지 못했습니다.',
      insertResult.error.message,
    );
  }

  if (!insertResult.data) {
    return failure<AdvertiserCampaignAdminErrorCode>(
      500,
      advertiserCampaignAdminErrorCodes.supabaseFailure,
      '생성된 체험단 정보를 확인하지 못했습니다.',
    );
  }

  const summary = mapCampaignRow(insertResult.data, createEmptyStats());

  return success(summary, 201);
};
