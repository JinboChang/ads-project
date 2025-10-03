import type { Hono } from 'hono';
import { respond, failure, success, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  AdvertiserProfilePayloadSchema,
  type AdvertiserProfilePayload,
} from '@/features/advertiser/backend/schema';
import {
  advertiserErrorCodes,
  type AdvertiserErrorCode,
} from '@/features/advertiser/backend/error';
import {
  getAdvertiserProfile,
  upsertAdvertiserProfile,
} from '@/features/advertiser/backend/service';

const extractAccessToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1] ?? null : null;
};

type AdvertiserErrorResult = ErrorResult<AdvertiserErrorCode, unknown>;

type ParsedAdvertiserPayload =
  | { ok: true; data: AdvertiserProfilePayload }
  | { ok: false; error: AdvertiserErrorResult };

const parsePayload = async (
  request: Request,
): Promise<ParsedAdvertiserPayload> => {
  try {
    const json = await request.json();
    const parsed = AdvertiserProfilePayloadSchema.safeParse(json);

    if (!parsed.success) {
      return {
        ok: false,
        error: failure(
          400,
          advertiserErrorCodes.invalidPayload,
          '愿묎퀬二??꾨줈???붿껌 媛믪씠 ?좏슚?섏? ?딆뒿?덈떎.',
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
        advertiserErrorCodes.invalidPayload,
        '愿묎퀬二??꾨줈???붿껌 蹂몃Ц???щ컮瑜댁? ?딆뒿?덈떎.',
      ),
    };
  }
};

type SupabaseClientInstance = ReturnType<typeof getSupabase>;
type AppLoggerInstance = ReturnType<typeof getLogger>;

const resolveAdvertiserUser = async (
  supabase: SupabaseClientInstance,
  logger: AppLoggerInstance,
  token: string | null,
) => {
  if (!token) {
    return failure(
      401,
      advertiserErrorCodes.unauthorized,
      '?몄쬆 ?좏겙???꾩슂?⑸땲??',
    );
  }

  const userResult = await supabase.auth.getUser(token);

  if (userResult.error || !userResult.data.user) {
    return failure(
      401,
      advertiserErrorCodes.unauthorized,
      '?몄쬆 ?뺣낫媛 ?좏슚?섏? ?딆뒿?덈떎.',
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
    logger.error('Failed to fetch base profile for advertiser', profileResult.error);
    return failure(
      500,
      advertiserErrorCodes.supabaseFailure,
      '?ъ슜???뺣낫瑜??뺤씤?섏? 紐삵뻽?듬땲??',
      profileResult.error.message,
    );
  }

  if (!profileResult.data || profileResult.data.role_type !== 'advertiser') {
    return failure(
      403,
      advertiserErrorCodes.forbidden,
      '愿묎퀬二??꾩슜 湲곕뒫?낅땲??',
    );
  }

  return success(userId, 200);
};

export const registerAdvertiserRoutes = (app: Hono<AppEnv>) => {
  app.get('/advertisers/profile', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const token = extractAccessToken(c.req.header('authorization'));

    const userIdResult = await resolveAdvertiserUser(supabase, logger, token);

    if (!userIdResult.ok) {
      return respond(c, userIdResult);
    }

    const result = await getAdvertiserProfile(supabase, userIdResult.data);

    return respond(c, result);
  });

  app.post('/advertisers/profile', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const token = extractAccessToken(c.req.header('authorization'));

    const parsedPayload = await parsePayload(c.req.raw);
    if (parsedPayload.ok === false) {
      return respond(c, parsedPayload.error);
    }

    const userIdResult = await resolveAdvertiserUser(supabase, logger, token);
    if (!userIdResult.ok) {
      return respond(c, userIdResult);
    }

    const result = await upsertAdvertiserProfile(
      supabase,
      logger,
      userIdResult.data,
      parsedPayload.data,
    );

    return respond(c, result);
  });
};

