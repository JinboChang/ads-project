export const onboardingErrorCodes = {
  duplicateEmail: 'SIGNUP_DUPLICATE_EMAIL',
  invalidPayload: 'SIGNUP_INVALID_PAYLOAD',
  supabaseFailure: 'SIGNUP_SUPABASE_FAILURE',
  profileInsertFailed: 'SIGNUP_PROFILE_INSERT_FAILED',
  unknown: 'SIGNUP_UNKNOWN_ERROR',
} as const;

export type OnboardingErrorCode =
  (typeof onboardingErrorCodes)[keyof typeof onboardingErrorCodes];

