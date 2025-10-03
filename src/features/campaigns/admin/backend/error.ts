export const advertiserCampaignAdminErrorCodes = {
  invalidParams: 'advertiser_campaign_admin_invalid_params',
  unauthorized: 'advertiser_campaign_admin_unauthorized',
  forbidden: 'advertiser_campaign_admin_forbidden',
  profileUnverified: 'advertiser_campaign_admin_profile_unverified',
  duplicateCampaign: 'advertiser_campaign_admin_duplicate_campaign',
  supabaseFailure: 'advertiser_campaign_admin_supabase_failure',
} as const;

export type AdvertiserCampaignAdminErrorCode =
  (typeof advertiserCampaignAdminErrorCodes)[keyof typeof advertiserCampaignAdminErrorCodes];
