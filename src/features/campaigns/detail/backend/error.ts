export const campaignDetailErrorCodes = {
  invalidParams: 'CAMPAIGN_DETAIL_INVALID_PARAMS',
  notFound: 'CAMPAIGN_DETAIL_NOT_FOUND',
  supabaseFailure: 'CAMPAIGN_DETAIL_SUPABASE_FAILURE',
  eligibilityComputationFailed: 'CAMPAIGN_DETAIL_ELIGIBILITY_FAILURE',
} as const;

export type CampaignDetailErrorCode =
  (typeof campaignDetailErrorCodes)[keyof typeof campaignDetailErrorCodes];
