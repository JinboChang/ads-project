export const advertiserCampaignDetailErrorCodes = {
  invalidParams: 'advertiser_campaign_detail_invalid_params',
  unauthorized: 'advertiser_campaign_detail_unauthorized',
  forbidden: 'advertiser_campaign_detail_forbidden',
  profileUnverified: 'advertiser_campaign_detail_profile_unverified',
  campaignNotFound: 'advertiser_campaign_detail_campaign_not_found',
  supabaseFailure: 'advertiser_campaign_detail_supabase_failure',
  invalidState: 'advertiser_campaign_detail_invalid_state',
  approvalQuotaExceeded: 'advertiser_campaign_detail_approval_quota_exceeded',
  unknownApplicants: 'advertiser_campaign_detail_unknown_applicants',
} as const;

export type AdvertiserCampaignDetailErrorCode =
  (typeof advertiserCampaignDetailErrorCodes)[keyof typeof advertiserCampaignDetailErrorCodes];
