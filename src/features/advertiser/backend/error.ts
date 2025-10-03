export const advertiserErrorCodes = {
  unauthorized: 'ADVERTISER_UNAUTHORIZED',
  forbidden: 'ADVERTISER_FORBIDDEN',
  invalidPayload: 'ADVERTISER_INVALID_PAYLOAD',
  duplicateBusinessRegistration: 'ADVERTISER_DUPLICATE_BUSINESS_REGISTRATION',
  supabaseFailure: 'ADVERTISER_SUPABASE_FAILURE',
  profileFetchFailed: 'ADVERTISER_PROFILE_FETCH_FAILED',
  verificationEnqueueFailed: 'ADVERTISER_VERIFICATION_ENQUEUE_FAILED',
} as const;

export type AdvertiserErrorCode =
  (typeof advertiserErrorCodes)[keyof typeof advertiserErrorCodes];
