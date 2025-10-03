export const campaignBrowseErrorCodes = {
  invalidQuery: 'CAMPAIGN_INVALID_QUERY',
  supabaseFailure: 'CAMPAIGN_SUPABASE_FAILURE',
} as const;

export type CampaignBrowseErrorCode =
  (typeof campaignBrowseErrorCodes)[keyof typeof campaignBrowseErrorCodes];
