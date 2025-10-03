import type { Hono } from 'hono';
import { respond, failure, success, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  InfluencerProfilePayloadSchema,
  type InfluencerProfilePayload,
} from '@/features/influencer/backend/schema';
import {
  influencerErrorCodes,
  type InfluencerErrorCode,
} from '@/features/influencer/backend/error';
import {
  getInfluencerProfile,
  upsertInfluencerProfile,
} from '@/features/influencer/backend/service';

const extractAccessToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
};

type InfluencerErrorResult = ErrorResult<InfluencerErrorCode, unknown>;

type ParsedPayload =
  | { ok: true; data: InfluencerProfilePayload }
  | { ok: false; error: InfluencerErrorResult };

const parsePayload = async (request: Request): Promise<ParsedPayload> => {
  try {
    const json = await request.json();
    const parsed = InfluencerProfilePayloadSchema.safeParse(json);

    if (!parsed.success) {
      return {
        ok: false,
        error: failure(
          400,
          influencerErrorCodes.invalidPayload,
          '인플루언서 프로필 요청 본문이 유효하지 않습니다.',
          parsed.error.format(),
        ),
      };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return {
      ok: false,
      error: failure(
        400,
        influencerErrorCodes.invalidPayload,
        '인플루언서 프로필 요청 본문을 해석할 수 없습니다.',
      ),
    };
  }
};

type SupabaseClientInstance = ReturnType<typeof getSupabase>;
type AppLoggerInstance = ReturnType<typeof getLogger>;

const resolveInfluencerUser = async (
  supabase: SupabaseClientInstance,
  logger: AppLoggerInstance,
  token: string | null,
) => {
  if (!token) {
    return failure(
      401,
      influencerErrorCodes.unauthorized,
      '접근 토큰이 필요합니다.',
    );
  }

  const userResult = await supabase.auth.getUser(token);

  if (userResult.error || !userResult.data.user) {
    return failure(
      401,
      influencerErrorCodes.unauthorized,
      '인증 정보가 유효하지 않습니다.',
      userResult.error?.message,
    );
  }

  const userId = userResult.data.user.id;

  const profileResult = await supabase
    .from('profiles')
    .select('role_type')
    .eq('user_id', userId)
    .maybeSingle<{ role_type: string }>();

  if (profileResult.error) {
    logger.error('Failed to fetch base profile for influencer', profileResult.error);
    return failure(
      500,
      influencerErrorCodes.supabaseFailure,
      '기본 프로필을 조회하지 못했습니다.',
      profileResult.error.message,
    );
  }

  if (!profileResult.data || profileResult.data.role_type !== 'influencer') {
    return failure(
      403,
      influencerErrorCodes.forbidden,
      '인플루언서 권한이 없습니다.',
    );
  }

  return success(userId, 200);
};

export const registerInfluencerRoutes = (app: Hono<AppEnv>) => {
  app.get('/influencers/profile', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const token = extractAccessToken(c.req.header('authorization'));

    const userIdResult = await resolveInfluencerUser(supabase, logger, token);

    if (!userIdResult.ok) {
      return respond(c, userIdResult);
    }

    const result = await getInfluencerProfile(supabase, userIdResult.data);

    return respond(c, result);
  });

  app.post('/influencers/profile', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const token = extractAccessToken(c.req.header('authorization'));

    const parsedPayload = await parsePayload(c.req.raw);
    if (parsedPayload.ok === false) {
      return respond(c, parsedPayload.error);
    }

    const userIdResult = await resolveInfluencerUser(supabase, logger, token);
    if (!userIdResult.ok) {
      return respond(c, userIdResult);
    }

    const result = await upsertInfluencerProfile(
      supabase,
      logger,
      userIdResult.data,
      parsedPayload.data,
    );

    return respond(c, result);
  });
};
