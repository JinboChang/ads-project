import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  advertiserCampaignAdminErrorCodes,
} from '@/features/campaigns/admin/backend/error';
import {
  AdvertiserCampaignCreateSchema,
  AdvertiserCampaignListQuerySchema,
} from '@/features/campaigns/admin/backend/schema';
import {
  createAdvertiserCampaign,
  listAdvertiserCampaigns,
} from '@/features/campaigns/admin/backend/service';

const extractAccessToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1] ?? null : null;
};

const advertiserCampaignsPath = '/advertisers/campaigns' as const;

export const registerAdvertiserCampaignAdminRoutes = (app: Hono<AppEnv>) => {
  app.get(advertiserCampaignsPath, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const token = extractAccessToken(c.req.header('authorization'));

    if (!token) {
      return respond(
        c,
        failure(
          401,
          advertiserCampaignAdminErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    const queryParams = AdvertiserCampaignListQuerySchema.safeParse({
      status: c.req.query('status') ?? undefined,
    });

    if (!queryParams.success) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignAdminErrorCodes.invalidParams,
          '체험단 목록 조회 요청 값이 유효하지 않습니다.',
          queryParams.error.format(),
        ),
      );
    }

    const userResult = await supabase.auth.getUser(token);

    if (userResult.error) {
      logger.error('Failed to resolve user for advertiser campaigns', userResult.error);
      return respond(
        c,
        failure(
          500,
          advertiserCampaignAdminErrorCodes.supabaseFailure,
          '사용자 인증 정보를 확인하지 못했습니다.',
          userResult.error.message,
        ),
      );
    }

    const user = userResult.data.user;

    if (!user) {
      return respond(
        c,
        failure(
          401,
          advertiserCampaignAdminErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    const result = await listAdvertiserCampaigns(
      supabase,
      logger,
      user.id,
      queryParams.data.status,
    );

    return respond(c, result);
  });

  app.post(advertiserCampaignsPath, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const token = extractAccessToken(c.req.header('authorization'));

    if (!token) {
      return respond(
        c,
        failure(
          401,
          advertiserCampaignAdminErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignAdminErrorCodes.invalidParams,
          '요청 본문을 해석하지 못했습니다.',
          error instanceof Error ? error.message : undefined,
        ),
      );
    }

    const payload = AdvertiserCampaignCreateSchema.safeParse(body);

    if (!payload.success) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignAdminErrorCodes.invalidParams,
          '체험단 등록 요청 값이 유효하지 않습니다.',
          payload.error.format(),
        ),
      );
    }

    const userResult = await supabase.auth.getUser(token);

    if (userResult.error) {
      logger.error('Failed to resolve user for advertiser campaign creation', userResult.error);
      return respond(
        c,
        failure(
          500,
          advertiserCampaignAdminErrorCodes.supabaseFailure,
          '사용자 인증 정보를 확인하지 못했습니다.',
          userResult.error.message,
        ),
      );
    }

    const user = userResult.data.user;

    if (!user) {
      return respond(
        c,
        failure(
          401,
          advertiserCampaignAdminErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    const result = await createAdvertiserCampaign(
      supabase,
      logger,
      user.id,
      payload.data,
    );

    return respond(c, result);
  });
};
