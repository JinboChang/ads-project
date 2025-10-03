import { isAfter, isBefore } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  campaignDetailErrorCodes,
  type CampaignDetailErrorCode,
} from '@/features/campaigns/detail/backend/error';
import type {
  CampaignDetailResponse,
  CampaignEligibility,
  CampaignStatus,
  ApplicationStatus,
} from '@/features/campaigns/lib/dto';

const openStatuses: CampaignStatus[] = ['recruiting'];

const applicationStatusOrder: ApplicationStatus[] = [
  'submitted',
  'approved',
  'rejected',
  'cancelled',
];

type CampaignRow = {
  id: number;
  advertiser_id: string;
  title: string;
  benefit_summary: string;
  mission_details: string;
  store_location: string;
  status: CampaignStatus;
  application_start_at: string;
  application_end_at: string;
  max_participants: number;
  created_at: string;
};

type ApplicationRow = {
  influencer_id: string;
  status: ApplicationStatus;
};

type InfluencerProfileRow = {
  verification_status: 'pending' | 'approved' | 'rejected';
};

const fetchCampaign = async (supabase: SupabaseClient, id: number) =>
  supabase
    .from('campaigns')
    .select(
      'id, advertiser_id, title, benefit_summary, mission_details, store_location, status, application_start_at, application_end_at, max_participants, created_at',
    )
    .eq('id', id)
    .maybeSingle();

const fetchApplications = async (supabase: SupabaseClient, id: number) =>
  supabase
    .from('applications')
    .select('influencer_id, status')
    .eq('campaign_id', id);

const fetchInfluencerProfile = async (
  supabase: SupabaseClient,
  influencerId: string,
) =>
  supabase
    .from('influencer_profiles')
    .select('verification_status')
    .eq('influencer_id', influencerId)
    .maybeSingle();

const fetchProfileRole = async (supabase: SupabaseClient, userId: string) =>
  supabase
    .from('profiles')
    .select('role_type')
    .eq('user_id', userId)
    .maybeSingle<{ role_type: string }>();

const isWithinPeriod = (startAt: string, endAt: string, now: Date) => {
  const start = new Date(startAt);
  const end = new Date(endAt);

  return !isBefore(now, start) && !isAfter(now, end);
};

const computeEligibility = (
  campaign: CampaignRow,
  influencerProfile: InfluencerProfileRow | null,
  campaignStatus: CampaignStatus,
  isAuthenticated: boolean,
  userRole: string | null,
  hasSubmittedApplication: ApplicationStatus | null,
  remainingSlots: number,
  now: Date,
): CampaignEligibility => {
  if (!isAuthenticated) {
    return { isEligible: false, reason: 'unauthenticated' };
  }

  if (userRole !== 'influencer') {
    return { isEligible: false, reason: 'not_influencer' };
  }

  if (!influencerProfile) {
    return { isEligible: false, reason: 'profile_incomplete' };
  }

  if (influencerProfile.verification_status !== 'approved') {
    return { isEligible: false, reason: 'profile_not_verified' };
  }

  if (hasSubmittedApplication) {
    return { isEligible: false, reason: 'already_applied' };
  }

  if (!openStatuses.includes(campaignStatus)) {
    return { isEligible: false, reason: 'campaign_closed' };
  }

  if (!isWithinPeriod(campaign.application_start_at, campaign.application_end_at, now)) {
    return { isEligible: false, reason: 'outside_period' };
  }

  if (remainingSlots <= 0) {
    return { isEligible: false, reason: 'quota_full' };
  }

  return { isEligible: true, reason: 'eligible' };
};

const findLatestApplicationStatus = (
  applications: ApplicationRow[],
  influencerId: string,
): ApplicationStatus | null => {
  const statuses = applications
    .filter((application) => application.influencer_id === influencerId)
    .map((application) => application.status);

  if (statuses.length === 0) {
    return null;
  }

  for (const status of applicationStatusOrder) {
    if (statuses.includes(status)) {
      return status;
    }
  }

  return statuses[0] ?? null;
};

const mapCampaignDetail = (
  campaign: CampaignRow,
  stats: {
    totalApplicants: number;
    approvedCount: number;
    remainingSlots: number;
  },
  eligibility: CampaignEligibility,
  userApplicationStatus: ApplicationStatus | null,
): CampaignDetailResponse => ({
  campaign: {
    id: campaign.id,
    title: campaign.title,
    benefitSummary: campaign.benefit_summary,
    missionDetails: campaign.mission_details,
    storeLocation: campaign.store_location,
    status: campaign.status,
    applicationStartAt: campaign.application_start_at,
    applicationEndAt: campaign.application_end_at,
    maxParticipants: campaign.max_participants,
    createdAt: campaign.created_at,
  },
  stats,
  eligibility,
  userApplicationStatus,
});

export const getCampaignDetail = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  campaignId: number,
  user?: { id: string } | null,
) => {
  const now = new Date();
  const campaignResult = await fetchCampaign(supabase, campaignId);

  if (campaignResult.error) {
    if (campaignResult.error.code === 'PGRST116') {
      return failure(
        404,
        campaignDetailErrorCodes.notFound,
        '요청한 체험단을 찾을 수 없습니다.',
      );
    }

    logger.error('Failed to fetch campaign detail', campaignResult.error);
    return failure(
      500,
      campaignDetailErrorCodes.supabaseFailure,
      '체험단 정보를 불러오지 못했습니다.',
      campaignResult.error.message,
    );
  }

  if (!campaignResult.data) {
    return failure(
      404,
      campaignDetailErrorCodes.notFound,
      '요청한 체험단을 찾을 수 없습니다.',
    );
  }

  const campaign = campaignResult.data;

  const applicationsResult = await fetchApplications(supabase, campaignId);

  if (applicationsResult.error) {
    logger.error('Failed to fetch campaign applications', applicationsResult.error);
    return failure(
      500,
      campaignDetailErrorCodes.supabaseFailure,
      '체험단 지원 정보를 불러오지 못했습니다.',
      applicationsResult.error.message,
    );
  }

  const applications = applicationsResult.data ?? [];
  const totalApplicants = applications.length;
  const approvedCount = applications.filter((item) => item.status === 'approved').length;
  const remainingSlots = Math.max(0, campaign.max_participants - approvedCount);

  let eligibility: CampaignEligibility = { isEligible: false, reason: 'unauthenticated' };
  let userApplicationStatus: ApplicationStatus | null = null;

  if (user?.id) {
    userApplicationStatus = findLatestApplicationStatus(applications, user.id);

    const profileRoleResult = await fetchProfileRole(supabase, user.id);

    if (profileRoleResult.error && profileRoleResult.error.code !== 'PGRST116') {
      logger.error('Failed to fetch base profile for campaign detail', profileRoleResult.error);
      return failure(
        500,
        campaignDetailErrorCodes.supabaseFailure,
        '사용자 정보를 확인하지 못했습니다.',
        profileRoleResult.error.message,
      );
    }

    const roleType = profileRoleResult.data?.role_type ?? null;

    const influencerProfileResult = await fetchInfluencerProfile(supabase, user.id);

    if (influencerProfileResult.error && influencerProfileResult.error.code !== 'PGRST116') {
      logger.error('Failed to fetch influencer profile for eligibility', influencerProfileResult.error);
      return failure(
        500,
        campaignDetailErrorCodes.eligibilityComputationFailed,
        '지원 가능 여부를 확인하지 못했습니다.',
        influencerProfileResult.error.message,
      );
    }

    const influencerProfile = influencerProfileResult.data ?? null;

    eligibility = computeEligibility(
      campaign,
      influencerProfile,
      campaign.status,
      true,
      roleType,
      userApplicationStatus,
      remainingSlots,
      now,
    );
  } else {
    eligibility = computeEligibility(
      campaign,
      null,
      campaign.status,
      false,
      null,
      null,
      remainingSlots,
      now,
    );
  }

  const detail = mapCampaignDetail(
    campaign,
    {
      totalApplicants,
      approvedCount,
      remainingSlots,
    },
    eligibility,
    userApplicationStatus,
  );

  return success(detail, 200);
};

export type CampaignDetailServiceError = CampaignDetailErrorCode;
