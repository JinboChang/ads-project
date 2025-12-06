import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  type MyApplicationSummary,
  type MyApplicationsResponse,
} from '@/features/applications/lib/dto';
import { applicationStatusValues, campaignStatusValues } from '@/features/campaigns/lib/dto';
import {
  influencerApplicationsErrorCodes,
  type InfluencerApplicationsErrorCode,
} from '@/features/applications/influencer/backend/error';

const PROFILES_TABLE = 'profiles';
const APPLICATIONS_TABLE = 'applications';
const APPLICATION_EVENTS_TABLE = 'application_events';

type ApplicationStatus = (typeof applicationStatusValues)[number];
type CampaignStatus = (typeof campaignStatusValues)[number];

type ApplicationRow = {
  id: number;
  campaign_id: number;
  status: ApplicationStatus;
  planned_visit_on: string | null;
  submitted_at: string;
  status_updated_at: string | null;
  campaigns: {
    id: number;
    title: string;
    status: CampaignStatus;
    application_end_at: string | null;
    benefit_summary: string | null;
  } | null;
};

type ApplicationEventRow = {
  application_id: number;
  context: Record<string, unknown> | null;
  recorded_at: string;
};

const fetchProfileRole = async (supabase: SupabaseClient, userId: string) =>
  supabase
    .from(PROFILES_TABLE)
    .select('role_type')
    .eq('user_id', userId)
    .maybeSingle<{ role_type: string | null }>();

const fetchApplications = async (
  supabase: SupabaseClient,
  userId: string,
  status?: ApplicationStatus | null,
) => {
  const query = supabase
    .from(APPLICATIONS_TABLE)
    .select(
      'id, campaign_id, status, planned_visit_on, submitted_at, status_updated_at, campaigns (id, title, status, application_end_at, benefit_summary)',
    )
    .eq('influencer_id', userId)
    .order('status_updated_at', { ascending: false, nullsFirst: false })
    .order('submitted_at', { ascending: false });

  if (status) {
    query.eq('status', status);
  }

  return query.returns<ApplicationRow[]>();
};

const fetchApplicationEvents = async (
  supabase: SupabaseClient,
  applicationIds: number[],
) => {
  if (applicationIds.length === 0) {
    return {
      data: [] as ApplicationEventRow[],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    };
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

  const candidateKeys = ['note', 'reason', 'message'] as const;

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

const toLatestNoteMap = (rows: ApplicationEventRow[]): Map<number, string> => {
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

const mapApplication = (
  row: ApplicationRow,
  latestNotes: Map<number, string>,
): MyApplicationSummary | null => {
  const campaign = row.campaigns;

  if (!campaign) {
    return null;
  }

  return {
    id: row.id,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    campaignStatus: campaign.status,
    campaignApplicationEndAt: campaign.application_end_at,
    benefitSummary: campaign.benefit_summary,
    appliedAt: row.submitted_at,
    plannedVisitOn: row.planned_visit_on,
    status: row.status,
    statusUpdatedAt: row.status_updated_at,
    latestNote: latestNotes.get(row.id) ?? null,
  };
};

export const getInfluencerApplications = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  status?: ApplicationStatus | null,
) => {
  const profileResult = await fetchProfileRole(supabase, userId);

  if (profileResult.error) {
    logger.error('Failed to fetch profile for influencer applications', profileResult.error);
    return failure<InfluencerApplicationsErrorCode>(
      500,
      influencerApplicationsErrorCodes.supabaseFailure,
      'Failed to verify user information.',
      profileResult.error.message,
    );
  }

  if (profileResult.data?.role_type !== 'influencer') {
    return failure<InfluencerApplicationsErrorCode>(
      403,
      influencerApplicationsErrorCodes.forbidden,
      'This feature is available to influencers only.',
    );
  }

  const applicationsResult = await fetchApplications(supabase, userId, status ?? null);

  if (applicationsResult.error) {
    logger.error('Failed to fetch influencer applications', applicationsResult.error);
    return failure<InfluencerApplicationsErrorCode>(
      500,
      influencerApplicationsErrorCodes.supabaseFailure,
      'Failed to load applications.',
      applicationsResult.error.message,
    );
  }

  const applicationRows = applicationsResult.data ?? [];
  const applicationIds = applicationRows.map((row) => row.id);

  const eventsResult = await fetchApplicationEvents(supabase, applicationIds);

  if (eventsResult.error) {
    logger.error('Failed to fetch application events for influencer applications', eventsResult.error);
    return failure<InfluencerApplicationsErrorCode>(
      500,
      influencerApplicationsErrorCodes.supabaseFailure,
      'Failed to load application history.',
      eventsResult.error.message,
    );
  }

  const latestNotes = toLatestNoteMap(eventsResult.data ?? []);

  const items = applicationRows
    .map((row) => mapApplication(row, latestNotes))
    .filter((item): item is MyApplicationSummary => item !== null);

  const response: MyApplicationsResponse = {
    items,
  };

  return success(response, 200);
};
