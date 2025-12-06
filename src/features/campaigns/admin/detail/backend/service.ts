import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  type AdvertiserCampaignSummary,
  type AdvertiserCampaignStats,
  campaignStatusValues,
  type CampaignStatus,
  type ApplicationStatus,
} from '@/features/campaigns/lib/dto';
import {
  AdvertiserApplicantSummarySchema,
  type AdvertiserApplicantSummary,
} from '@/features/applications/lib/dto';
import {
  advertiserCampaignDetailErrorCodes,
  type AdvertiserCampaignDetailErrorCode,
} from '@/features/campaigns/admin/detail/backend/error';
import {
  AdvertiserCampaignDetailResponseSchema,
  type AdvertiserCampaignDetailResponse,
  CampaignWorkflowResultSchema,
} from '@/features/campaigns/admin/detail/backend/schema';
import { fetchCampaignStatsMap, resetCampaignStats } from '@/features/campaigns/admin/backend/stats-service';

const ADVERTISER_PROFILES_TABLE = 'advertiser_profiles';
const CAMPAIGNS_TABLE = 'campaigns';
const APPLICATIONS_TABLE = 'applications';
const PROFILES_TABLE = 'profiles';
const INFLUENCER_CHANNELS_TABLE = 'influencer_channels';
const APPLICATION_EVENTS_TABLE = 'application_events';

export const createEmptyStats = (): AdvertiserCampaignStats => resetCampaignStats();

type AdvertiserProfileRow = {
  verification_status: 'pending' | 'approved' | 'rejected';
};

export type CampaignRow = {
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

type ApplicationRow = {
  id: number;
  influencer_id: string;
  status: ApplicationStatus;
  motivation_note: string | null;
  planned_visit_on: string | null;
  submitted_at: string;
  status_updated_at: string | null;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
};

type ChannelRow = {
  influencer_id: string;
  platform: string;
  channel_name: string | null;
  channel_url: string | null;
  last_verified_at: string | null;
};

type ApplicationEventRow = {
  application_id: number;
  context: Record<string, unknown> | null;
  recorded_at: string;
};

const campaignStatusSet = new Set<CampaignStatus>(campaignStatusValues);

const ensureCampaignStatus = (status: string): CampaignStatus => {
  if (campaignStatusSet.has(status as CampaignStatus)) {
    return status as CampaignStatus;
  }

  return 'recruiting';
};

export const mapCampaignRowToSummary = (
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

export const fetchAdvertiserProfile = async (
  supabase: SupabaseClient,
  userId: string,
) =>
  supabase
    .from(ADVERTISER_PROFILES_TABLE)
    .select('verification_status')
    .eq('advertiser_id', userId)
    .maybeSingle<AdvertiserProfileRow>();

export const fetchCampaignRow = async (
  supabase: SupabaseClient,
  campaignId: number,
) =>
  supabase
    .from(CAMPAIGNS_TABLE)
    .select(
      'id, advertiser_id, title, benefit_summary, mission_details, store_location, status, application_start_at, application_end_at, max_participants, created_at, updated_at',
    )
    .eq('id', campaignId)
    .maybeSingle<CampaignRow>();

const fetchApplicationRows = async (
  supabase: SupabaseClient,
  campaignId: number,
) =>
  supabase
    .from(APPLICATIONS_TABLE)
    .select(
      'id, influencer_id, status, motivation_note, planned_visit_on, submitted_at, status_updated_at',
    )
    .eq('campaign_id', campaignId)
    .order('submitted_at', { ascending: true })
    .returns<ApplicationRow[]>();

const fetchProfiles = async (
  supabase: SupabaseClient,
  influencerIds: string[],
) => {
  if (influencerIds.length === 0) {
    return {
      data: [] as ProfileRow[],
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
    };
  }

  return supabase
    .from(PROFILES_TABLE)
    .select('user_id, full_name, phone')
    .in('user_id', influencerIds)
    .returns<ProfileRow[]>();
};

const fetchChannels = async (
  supabase: SupabaseClient,
  influencerIds: string[],
) => {
  if (influencerIds.length === 0) {
    return {
      data: [] as ChannelRow[],
      error: null,
      status: 200,
      statusText: 'OK',
      count: null,
    };
  }

  return supabase
    .from(INFLUENCER_CHANNELS_TABLE)
    .select('influencer_id, platform, channel_name, channel_url, last_verified_at')
    .in('influencer_id', influencerIds)
    .returns<ChannelRow[]>();
};

const fetchApplicationEvents = async (
  supabase: SupabaseClient,
  applicationIds: number[],
) => {
  if (applicationIds.length === 0) {
    return { data: [] as ApplicationEventRow[], error: null, count: null, status: 200, statusText: 'OK' };
  }

  return supabase
    .from(APPLICATION_EVENTS_TABLE)
    .select('application_id, context, recorded_at')
    .in('application_id', applicationIds)
    .order('recorded_at', { ascending: false })
    .returns<ApplicationEventRow[]>();
};

const extractNoteFromContext = (
  context: Record<string, unknown> | null,
): string | null => {
  if (!context) {
    return null;
  }

  const candidateKeys = ['note', 'reason', 'message', 'comment'] as const;

  for (const key of candidateKeys) {
    const value = context[key];

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
};

const buildLatestNotesMap = (rows: ApplicationEventRow[]) => {
  const noteMap = new Map<number, string>();

  for (const row of rows) {
    if (noteMap.has(row.application_id)) {
      continue;
    }

    const note = extractNoteFromContext(row.context);

    if (note) {
      noteMap.set(row.application_id, note);
    }
  }

  return noteMap;
};

const mapChannelsByInfluencer = (rows: ChannelRow[]) => {
  const channelMap = new Map<string, ChannelRow[]>();

  for (const row of rows) {
    const list = channelMap.get(row.influencer_id) ?? [];
    list.push(row);
    channelMap.set(row.influencer_id, list);
  }

  for (const [key, list] of channelMap.entries()) {
    list.sort((a, b) => {
      const timeA = a.last_verified_at ? new Date(a.last_verified_at).getTime() : 0;
      const timeB = b.last_verified_at ? new Date(b.last_verified_at).getTime() : 0;
      return timeB - timeA;
    });
  }

  return channelMap;
};

const mapApplicants = (
  applicationRows: ApplicationRow[],
  profiles: ProfileRow[],
  channels: ChannelRow[],
  notes: Map<number, string>,
): AdvertiserApplicantSummary[] => {
  const profileMap = new Map<string, ProfileRow>();
  profiles.forEach((profile) => {
    profileMap.set(profile.user_id, profile);
  });

  const channelMap = mapChannelsByInfluencer(channels);

  return applicationRows
    .map((row) => {
      const profile = profileMap.get(row.influencer_id);
      const applicant = {
        id: row.id,
        influencerId: row.influencer_id,
        influencerName: profile?.full_name ?? 'Name unavailable',
        influencerEmail: profile?.phone ?? null,
        status: row.status,
        submittedAt: row.submitted_at,
        statusUpdatedAt: row.status_updated_at,
        plannedVisitOn: row.planned_visit_on,
        motivationNote: row.motivation_note,
        latestNote: notes.get(row.id) ?? null,
        channels: (channelMap.get(row.influencer_id) ?? []).map((channel) => ({
          platform: channel.platform,
          channelName: channel.channel_name,
          channelUrl: channel.channel_url,
        })),
      } satisfies AdvertiserApplicantSummary;

      const parsed = AdvertiserApplicantSummarySchema.safeParse(applicant);

      if (!parsed.success) {
        return null;
      }

      return parsed.data;
    })
    .filter((item): item is AdvertiserApplicantSummary => item !== null);
};

export const getAdvertiserCampaignDetail = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  campaignId: number,
) => {
  const profileResult = await fetchAdvertiserProfile(supabase, userId);

  if (profileResult.error) {
    logger.error('Failed to fetch advertiser profile for detail', profileResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      'Failed to load advertiser information.',
      profileResult.error.message,
    );
  }

  if (!profileResult.data) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      403,
      advertiserCampaignDetailErrorCodes.forbidden,
      'This feature is for advertisers only.',
    );
  }

  if (profileResult.data.verification_status !== 'approved') {
    return failure<AdvertiserCampaignDetailErrorCode>(
      403,
      advertiserCampaignDetailErrorCodes.profileUnverified,
      'Available after your advertiser profile is verified.',
    );
  }

  const campaignResult = await fetchCampaignRow(supabase, campaignId);

  if (campaignResult.error) {
    logger.error('Failed to fetch advertiser campaign detail', campaignResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      'Failed to load campaign information.',
      campaignResult.error.message,
    );
  }

  if (!campaignResult.data) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      404,
      advertiserCampaignDetailErrorCodes.campaignNotFound,
      'The requested campaign was not found.',
    );
  }

  if (campaignResult.data.advertiser_id !== userId) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      403,
      advertiserCampaignDetailErrorCodes.forbidden,
      'You do not have permission to manage this campaign.',
    );
  }

  const applicationResult = await fetchApplicationRows(supabase, campaignId);

  if (applicationResult.error) {
    logger.error('Failed to fetch campaign applicants', applicationResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      'Failed to load applicants.',
      applicationResult.error.message,
    );
  }

  const applicationRows = applicationResult.data ?? [];
  const influencerIds = Array.from(new Set(applicationRows.map((row) => row.influencer_id)));
  const applicationIds = applicationRows.map((row) => row.id);

  const [profilesResult, channelsResult, eventsResult] = await Promise.all([
    fetchProfiles(supabase, influencerIds),
    fetchChannels(supabase, influencerIds),
    fetchApplicationEvents(supabase, applicationIds),
  ]);

  if (profilesResult.error) {
    logger.error('Failed to fetch applicant profiles', profilesResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      'Failed to load applicant profiles.',
      profilesResult.error.message,
    );
  }

  if (channelsResult.error) {
    logger.error('Failed to fetch applicant channels', channelsResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      'Failed to load applicant channel information.',
      channelsResult.error.message,
    );
  }

  if (eventsResult.error) {
    logger.error('Failed to fetch applicant events', eventsResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      'Failed to load applicant event logs.',
      eventsResult.error.message,
    );
  }

  let statsMap: Map<number, AdvertiserCampaignStats>;

  try {
    statsMap = await fetchCampaignStatsMap(supabase, [campaignId]);
  } catch (error) {
    logger.error('Failed to aggregate campaign stats for detail', error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      'Failed to calculate campaign statistics.',
      error instanceof Error ? error.message : undefined,
    );
  }

  const campaignStats = statsMap.get(campaignId) ?? createEmptyStats();
  const campaignSummary = mapCampaignRowToSummary(campaignResult.data, campaignStats);
  const notesMap = buildLatestNotesMap(eventsResult.data ?? []);
  const applicants = mapApplicants(
    applicationRows,
    profilesResult.data ?? [],
    channelsResult.data ?? [],
    notesMap,
  );

  const response: AdvertiserCampaignDetailResponse = {
    campaign: campaignSummary,
    applicants,
  };

  const parsed = AdvertiserCampaignDetailResponseSchema.safeParse(response);

  if (!parsed.success) {
    logger.error('Advertiser campaign detail response validation failed', parsed.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      'Failed to build the campaign detail response.',
      parsed.error.format(),
    );
  }

  return success(parsed.data, 200);
};

export const mapWorkflowResult = (
  campaign: AdvertiserCampaignSummary,
) => CampaignWorkflowResultSchema.parse({ campaign });

export type AdvertiserCampaignDetailServiceError = AdvertiserCampaignDetailErrorCode;
