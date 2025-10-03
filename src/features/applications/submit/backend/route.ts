import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  CampaignApplicationPayloadSchema,
} from '@/features/applications/submit/backend/schema';
import {
  campaignApplicationErrorCodes,
} from '@/features/applications/submit/backend/error';
import { submitCampaignApplication } from '@/features/applications/submit/backend/service';

const extractAccessToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1] ?? null : null;
};

export const registerCampaignApplicationRoutes = (app: Hono<AppEnv>) => {
  app.post('/applications', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const payloadParseResult = await CampaignApplicationPayloadSchema.safeParseAsync(
      await c.req.json().catch(() => ({})),
    );

    if (!payloadParseResult.success) {
      return respond(
        c,
        failure(
          400,
          campaignApplicationErrorCodes.invalidPayload,
          '체험단 지원 요청 값이 유효하지 않습니다.',
          payloadParseResult.error.format(),
        ),
      );
    }

    const token = extractAccessToken(c.req.header('authorization'));

    if (!token) {
      return respond(
        c,
        failure(
          401,
          campaignApplicationErrorCodes.unauthorized,
          '지원하려면 로그인이 필요합니다.',
        ),
      );
    }

    const userResult = await supabase.auth.getUser(token);

    if (userResult.error || !userResult.data.user) {
      return respond(
        c,
        failure(
          401,
          campaignApplicationErrorCodes.unauthorized,
          '유효하지 않은 인증 토큰입니다.',
          userResult.error?.message,
        ),
      );
    }

    const result = await submitCampaignApplication(
      supabase,
      logger,
      userResult.data.user.id,
      payloadParseResult.data,
    );

    return respond(c, result);
  });
};
