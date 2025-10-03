export const influencerErrorCodes = {
  unauthorized: 'INFLUENCER_UNAUTHORIZED',
  forbidden: 'INFLUENCER_FORBIDDEN',
  invalidPayload: 'INFLUENCER_INVALID_PAYLOAD',
  underAge: 'INFLUENCER_UNDER_AGE',
  channelDuplicate: 'INFLUENCER_CHANNEL_DUPLICATE',
  supabaseFailure: 'INFLUENCER_SUPABASE_FAILURE',
  profileFetchFailed: 'INFLUENCER_PROFILE_FETCH_FAILED',
  onboardingStatusConflict: 'INFLUENCER_ONBOARDING_STATUS_CONFLICT',
} as const;

export type InfluencerErrorCode =
  (typeof influencerErrorCodes)[keyof typeof influencerErrorCodes];
