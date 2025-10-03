import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  advertiserCampaignDetailErrorCodes,
} from '@/features/campaigns/admin/detail/backend/error';
import {
  AdvertiserCampaignDetailParamsSchema,
  AdvertiserCampaignDetailResponseSchema,
} from '@/features/campaigns/admin/detail/backend/schema';
import { getAdvertiserCampaignDetail } from '@/features/campaigns/admin/detail/backend/service';
import {
  approveApplicants,
  closeCampaign,
  reopenCampaign,
} from '@/features/campaigns/admin/detail/backend/workflow-service';

const extractAccessToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1] ?? null : null;
};

const advertiserCampaignDetailBasePath = '/advertisers/campaigns/:id' as const;

export const registerAdvertiserCampaignDetailRoutes = (app: Hono<AppEnv>) => {
  app.get(advertiserCampaignDetailBasePath, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const paramsParse = AdvertiserCampaignDetailParamsSchema.safeParse({
      id: c.req.param('id'),
    });

    if (!paramsParse.success) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignDetailErrorCodes.invalidParams,
          '체험단 상세 요청 값이 유효하지 않습니다.',
          paramsParse.error.format(),
        ),
      );
    }

    const token = extractAccessToken(c.req.header('authorization'));

    if (!token) {
      return respond(
        c,
        failure(
          401,
          advertiserCampaignDetailErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    const userResult = await supabase.auth.getUser(token);

    if (userResult.error) {
      logger.error('Failed to resolve user for advertiser campaign detail', userResult.error);
      return respond(
        c,
        failure(
          500,
          advertiserCampaignDetailErrorCodes.supabaseFailure,
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
          advertiserCampaignDetailErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    const result = await getAdvertiserCampaignDetail(
      supabase,
      logger,
      user.id,
      paramsParse.data.id,
    );

    if (result.ok) {
      const parsed = AdvertiserCampaignDetailResponseSchema.safeParse(result.data);

      if (!parsed.success) {
        logger.error('Advertiser campaign detail response validation failed at route', parsed.error);
        return respond(
          c,
          failure(
            500,
            advertiserCampaignDetailErrorCodes.supabaseFailure,
            '체험단 상세 정보를 구성하지 못했습니다.',
            parsed.error.format(),
          ),
        );
      }
    }

    return respond(c, result);
  });

  app.post(`${advertiserCampaignDetailBasePath}/close`, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const paramsParse = AdvertiserCampaignDetailParamsSchema.safeParse({
      id: c.req.param('id'),
    });

    if (!paramsParse.success) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignDetailErrorCodes.invalidParams,
          '모집 종료 요청 값이 유효하지 않습니다.',
          paramsParse.error.format(),
        ),
      );
    }

    const token = extractAccessToken(c.req.header('authorization'));

    if (!token) {
      return respond(
        c,
        failure(
          401,
          advertiserCampaignDetailErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    let body: unknown;

    try {
      body = (await c.req.json()) ?? {};
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignDetailErrorCodes.invalidParams,
          '요청 본문을 해석하지 못했습니다.',
          error instanceof Error ? error.message : undefined,
        ),
      );
    }

    const userResult = await supabase.auth.getUser(token);

    if (userResult.error) {
      logger.error('Failed to resolve user for campaign close workflow', userResult.error);
      return respond(
        c,
        failure(
          500,
          advertiserCampaignDetailErrorCodes.supabaseFailure,
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
          advertiserCampaignDetailErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    const result = await closeCampaign(
      supabase,
      logger,
      user.id,
      paramsParse.data.id,
      body ?? {},
    );

    return respond(c, result);
  });

  app.post(`${advertiserCampaignDetailBasePath}/approve`, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const paramsParse = AdvertiserCampaignDetailParamsSchema.safeParse({
      id: c.req.param('id'),
    });

    if (!paramsParse.success) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignDetailErrorCodes.invalidParams,
          '선정 요청 값이 유효하지 않습니다.',
          paramsParse.error.format(),
        ),
      );
    }

    const token = extractAccessToken(c.req.header('authorization'));

    if (!token) {
      return respond(
        c,
        failure(
          401,
          advertiserCampaignDetailErrorCodes.unauthorized,
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
          advertiserCampaignDetailErrorCodes.invalidParams,
          '요청 본문을 해석하지 못했습니다.',
          error instanceof Error ? error.message : undefined,
        ),
      );
    }

    const userResult = await supabase.auth.getUser(token);

    if (userResult.error) {
      logger.error('Failed to resolve user for campaign approval workflow', userResult.error);
      return respond(
        c,
        failure(
          500,
          advertiserCampaignDetailErrorCodes.supabaseFailure,
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
          advertiserCampaignDetailErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    const result = await approveApplicants(
      supabase,
      logger,
      user.id,
      paramsParse.data.id,
      body ?? {},
    );

    return respond(c, result);
  });

  app.post(`${advertiserCampaignDetailBasePath}/reopen`, async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const paramsParse = AdvertiserCampaignDetailParamsSchema.safeParse({
      id: c.req.param('id'),
    });

    if (!paramsParse.success) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignDetailErrorCodes.invalidParams,
          '재모집 요청 값이 유효하지 않습니다.',
          paramsParse.error.format(),
        ),
      );
    }

    const token = extractAccessToken(c.req.header('authorization'));

    if (!token) {
      return respond(
        c,
        failure(
          401,
          advertiserCampaignDetailErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    let body: unknown;

    try {
      body = (await c.req.json()) ?? {};
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignDetailErrorCodes.invalidParams,
          '요청 본문을 해석하지 못했습니다.',
          error instanceof Error ? error.message : undefined,
        ),
      );
    }

    const userResult = await supabase.auth.getUser(token);

    if (userResult.error) {
      logger.error('Failed to resolve user for campaign reopen workflow', userResult.error);
      return respond(
        c,
        failure(
          500,
          advertiserCampaignDetailErrorCodes.supabaseFailure,
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
          advertiserCampaignDetailErrorCodes.unauthorized,
          '로그인이 필요한 서비스입니다.',
        ),
      );
    }

    const result = await reopenCampaign(
      supabase,
      logger,
      user.id,
      paramsParse.data.id,
      body ?? {},
    );

    return respond(c, result);
  });
};
