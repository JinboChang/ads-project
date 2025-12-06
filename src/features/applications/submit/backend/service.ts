import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  campaignApplicationErrorCodes,
  type CampaignApplicationErrorCode,
} from '@/features/applications/submit/backend/error';
import type {
  CampaignApplicationPayload,
  CampaignApplicationResponse,
} from '@/features/applications/submit/backend/schema';
import type { CampaignStatus } from '@/features/campaigns/lib/dto';

const APPLICATION_EVENTS_TABLE = 'application_events';

const openStatuses: CampaignStatus[] = ['recruiting'];

const fetchCampaign = async (supabase: SupabaseClient, campaignId: number) =>
  supabase
    .from('campaigns')
    .select(
      'id, advertiser_id, title, status, application_start_at, application_end_at, max_participants',
    )
    .eq('id', campaignId)
    .maybeSingle<{
      id: number;
      advertiser_id: string;
      title: string;
      status: CampaignStatus;
      application_start_at: string;
      application_end_at: string;
      max_participants: number;
    }>();

const fetchProfileRole = async (supabase: SupabaseClient, userId: string) =>
  supabase
    .from('profiles')
    .select('role_type')
    .eq('user_id', userId)
    .maybeSingle<{ role_type: string }>();

const fetchInfluencerProfile = async (supabase: SupabaseClient, userId: string) =>
  supabase
    .from('influencer_profiles')
    .select('verification_status')
    .eq('influencer_id', userId)
    .maybeSingle<{ verification_status: 'pending' | 'approved' | 'rejected' }>();

const fetchExistingApplication = async (
  supabase: SupabaseClient,
  userId: string,
  campaignId: number,
) =>
  supabase
    .from('applications')
    .select('id, status')
    .eq('campaign_id', campaignId)
    .eq('influencer_id', userId)
    .maybeSingle<{ id: number; status: string }>();

const countApprovedApplications = async (
  supabase: SupabaseClient,
  campaignId: number,
) =>
  supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'approved');

const isWithinPeriod = (startAt: string, endAt: string, now: Date) => {
  const start = new Date(startAt);
  const end = new Date(endAt);

  return now >= start && now <= end;
};

const toDateOnly = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().substring(0, 10);
};

export const submitCampaignApplication = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  payload: CampaignApplicationPayload,
) => {
  const now = new Date();

  const campaignResult = await fetchCampaign(supabase, payload.campaignId);

  if (campaignResult.error) {
    if (campaignResult.error.code === 'PGRST116') {
      return failure(
        404,
        campaignApplicationErrorCodes.campaignNotFound,
        'The requested campaign was not found.',
      );
    }

    logger.error('Failed to fetch campaign for application', campaignResult.error);
    return failure(
      500,
      campaignApplicationErrorCodes.supabaseFailure,
      'Failed to retrieve campaign information.',
      campaignResult.error.message,
    );
  }

  const campaign = campaignResult.data;

  if (!campaign) {
    return failure(
      404,
      campaignApplicationErrorCodes.campaignNotFound,
      'The requested campaign was not found.',
    );
  }

  const profileRoleResult = await fetchProfileRole(supabase, userId);

  if (profileRoleResult.error) {
    logger.error('Failed to fetch base profile for application', profileRoleResult.error);
    return failure(
      500,
      campaignApplicationErrorCodes.supabaseFailure,
      'Failed to verify user information.',
      profileRoleResult.error.message,
    );
  }

  if (!profileRoleResult.data || profileRoleResult.data.role_type !== 'influencer') {
    return failure(
      403,
      campaignApplicationErrorCodes.forbidden,
      'Only influencers can apply.',
    );
  }

  const influencerProfileResult = await fetchInfluencerProfile(supabase, userId);

  if (influencerProfileResult.error) {
    logger.error('Failed to fetch influencer profile for application', influencerProfileResult.error);
    return failure(
      500,
      campaignApplicationErrorCodes.supabaseFailure,
      'Failed to load the influencer profile.',
      influencerProfileResult.error.message,
    );
  }

  if (!influencerProfileResult.data) {
    return failure(
      400,
      campaignApplicationErrorCodes.profileIncomplete,
      'Please create your influencer profile first.',
    );
  }

  if (influencerProfileResult.data.verification_status !== 'approved') {
    return failure(
      400,
      campaignApplicationErrorCodes.profileNotVerified,
      'Your influencer profile must be verified before you can apply.',
    );
  }

  if (!openStatuses.includes(campaign.status)) {
    return failure(
      400,
      campaignApplicationErrorCodes.campaignClosed,
      'This campaign is closed.',
    );
  }

  if (!isWithinPeriod(campaign.application_start_at, campaign.application_end_at, now)) {
    return failure(
      400,
      campaignApplicationErrorCodes.outsidePeriod,
      'Applications are not open right now.',
    );
  }

  const duplicateCheck = await fetchExistingApplication(supabase, userId, payload.campaignId);

  if (duplicateCheck.error && duplicateCheck.error.code !== 'PGRST116') {
    logger.error('Failed to check duplicate applications', duplicateCheck.error);
    return failure(
      500,
      campaignApplicationErrorCodes.supabaseFailure,
      'Failed to check application information.',
      duplicateCheck.error.message,
    );
  }

  if (duplicateCheck.data) {
    return failure(
      409,
      campaignApplicationErrorCodes.duplicateApplication,
      'You have already applied to this campaign.',
    );
  }

  const approvedCountResult = await countApprovedApplications(
    supabase,
    payload.campaignId,
  );

  if (approvedCountResult.error) {
    logger.error('Failed to count approved applications', approvedCountResult.error);
    return failure(
      500,
      campaignApplicationErrorCodes.supabaseFailure,
      'Failed to check application status.',
      approvedCountResult.error.message,
    );
  }

  const approvedCount = approvedCountResult.count ?? 0;
  const remainingSlots = Math.max(0, campaign.max_participants - approvedCount);

  if (remainingSlots <= 0) {
    return failure(
      400,
      campaignApplicationErrorCodes.quotaFull,
      'All available slots have been filled.',
    );
  }

  const visitDate = toDateOnly(payload.plannedVisitOn);

  if (!visitDate) {
    return failure(
      400,
      campaignApplicationErrorCodes.invalidPayload,
      'Enter a valid planned visit date.',
    );
  }

  const insertResult = await supabase
    .from('applications')
    .insert({
      campaign_id: payload.campaignId,
      influencer_id: userId,
      motivation_note: payload.motivationNote.trim(),
      planned_visit_on: visitDate,
      status: 'submitted',
    })
    .select('id, submitted_at')
    .maybeSingle<{ id: number; submitted_at: string }>();

  if (insertResult.error || !insertResult.data) {
    logger.error('Failed to insert application', insertResult.error);
    return failure(
      500,
      campaignApplicationErrorCodes.supabaseFailure,
      'Failed to save the application.',
      insertResult.error?.message,
    );
  }

  const applicationId = insertResult.data.id;

  const eventResult = await supabase.from(APPLICATION_EVENTS_TABLE).insert({
    application_id: applicationId,
    performed_by: userId,
    event_type: 'submitted',
    to_status: 'submitted',
    context: {
      motivation_note_length: payload.motivationNote.length,
    },
  });

  if (eventResult.error) {
    logger.warn('Failed to record application event', eventResult.error);
  }

  const response: CampaignApplicationResponse = {
    applicationId,
    status: 'submitted',
    submittedAt: insertResult.data.submitted_at,
  };

  return success(response, 201);
};

export type CampaignApplicationServiceError = CampaignApplicationErrorCode;
