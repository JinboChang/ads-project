export const influencerApplicationsErrorCodes = {
  invalidParams: 'influencer_applications_invalid_params',
  unauthorized: 'influencer_applications_unauthorized',
  forbidden: 'influencer_applications_forbidden',
  supabaseFailure: 'influencer_applications_supabase_failure',
} as const;

export type InfluencerApplicationsErrorCode =
  (typeof influencerApplicationsErrorCodes)[keyof typeof influencerApplicationsErrorCodes];
