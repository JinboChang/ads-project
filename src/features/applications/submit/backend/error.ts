export const campaignApplicationErrorCodes = {
  unauthorized: 'APPLICATION_UNAUTHORIZED',
  forbidden: 'APPLICATION_FORBIDDEN',
  invalidPayload: 'APPLICATION_INVALID_PAYLOAD',
  campaignNotFound: 'APPLICATION_CAMPAIGN_NOT_FOUND',
  duplicateApplication: 'APPLICATION_DUPLICATE',
  campaignClosed: 'APPLICATION_CAMPAIGN_CLOSED',
  outsidePeriod: 'APPLICATION_OUTSIDE_PERIOD',
  profileIncomplete: 'APPLICATION_PROFILE_INCOMPLETE',
  profileNotVerified: 'APPLICATION_PROFILE_NOT_VERIFIED',
  quotaFull: 'APPLICATION_QUOTA_FULL',
  supabaseFailure: 'APPLICATION_SUPABASE_FAILURE',
} as const;

export type CampaignApplicationErrorCode =
  (typeof campaignApplicationErrorCodes)[keyof typeof campaignApplicationErrorCodes];
