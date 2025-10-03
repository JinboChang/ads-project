import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  onboardingErrorCodes,
  type OnboardingErrorCode,
} from '@/features/onboarding/backend/error';
import type {
  SignupPayload,
  SignupResult,
} from '@/features/onboarding/backend/schema';

const duplicateEmailMessages = [
  'User already registered',
  'duplicate key value violates unique constraint',
];

const getNextPath = (roleType: SignupPayload['roleType']) =>
  roleType === 'influencer' ? '/influencer/profile' : '/advertiser/profile';

export const handleSignup = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  payload: SignupPayload,
) => {
  const { email, password, fullName, phone, roleType, verificationMethod } =
    payload;

  const emailConfirmationRedirect = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
    : undefined;

  const signUpResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        fullName,
        phone,
        roleType,
        verificationMethod,
      },
      ...(emailConfirmationRedirect
        ? { emailRedirectTo: emailConfirmationRedirect }
        : {}),
    },
  });

  if (signUpResult.error) {
    const message = signUpResult.error.message ?? 'Unknown Supabase error.';

    if (
      duplicateEmailMessages.some((candidate) =>
        message.toLowerCase().includes(candidate.toLowerCase()),
      )
    ) {
      return failure(409, onboardingErrorCodes.duplicateEmail, message);
    }

    logger.error('Failed to sign up Supabase auth user', message);

    return failure(500, onboardingErrorCodes.supabaseFailure, message);
  }

  const user = signUpResult.data.user;

  if (!user) {
    logger.error('Supabase auth returned empty user payload');
    return failure(
      500,
      onboardingErrorCodes.supabaseFailure,
      '회원가입 처리 중 오류가 발생했습니다.',
    );
  }

  const profileInsert = await supabase.from('profiles').insert({
    user_id: user.id,
    role_type: roleType,
    full_name: fullName,
    phone,
    verification_method: verificationMethod,
    onboarding_status: 'pending',
  });

  if (profileInsert.error) {
    logger.error('Failed to insert base profile', profileInsert.error);

    await supabase.auth.admin.deleteUser(user.id);

    return failure(
      500,
      onboardingErrorCodes.profileInsertFailed,
      '회원 프로필 저장에 실패했습니다.',
      profileInsert.error.message,
    );
  }

  const result: SignupResult = {
    userId: user.id,
    nextPath: getNextPath(roleType),
    onboardingStatus: 'pending',
  };

  return success(result, 201);
};

export type SignupHandlerResult = Awaited<ReturnType<typeof handleSignup>>;
export type SignupError = SignupHandlerResult extends { ok: false }
  ? OnboardingErrorCode
  : never;
