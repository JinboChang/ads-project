import type { Hono } from 'hono';
import { respond, failure, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  SignupPayloadSchema,
  type SignupPayload,
} from '@/features/onboarding/backend/schema';
import { onboardingErrorCodes } from '@/features/onboarding/backend/error';
import { handleSignup } from '@/features/onboarding/backend/service';

type SignupErrorResult = ErrorResult<
  (typeof onboardingErrorCodes)[keyof typeof onboardingErrorCodes],
  unknown
>;

type SignupPayloadSuccess = { ok: true; data: SignupPayload };

type SignupPayloadFailure = { ok: false; error: SignupErrorResult };

type ParsedSignupPayload = SignupPayloadSuccess | SignupPayloadFailure;

const parseSignupPayload = async (
  request: Request,
): Promise<ParsedSignupPayload> => {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return {
      ok: false,
      error: failure(
        400,
        onboardingErrorCodes.invalidPayload,
        'The sign-up request body is invalid.',
      ),
    };
  }

  const parsed = SignupPayloadSchema.safeParse(json);

  if (!parsed.success) {
    return {
      ok: false,
      error: failure(
        400,
        onboardingErrorCodes.invalidPayload,
        'The sign-up payload is invalid.',
        parsed.error.format(),
      ),
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
};

export const registerOnboardingRoutes = (app: Hono<AppEnv>) => {
  app.post('/onboarding/signup', async (c) => {
    const parsed = await parseSignupPayload(c.req.raw);

    if (parsed.ok === false) {
      return respond(c, parsed.error);
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await handleSignup(supabase, logger, parsed.data);

    return respond(c, result);
  });
};
