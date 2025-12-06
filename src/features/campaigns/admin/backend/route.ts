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
          'Please sign in to continue.',
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
          'The campaign list query parameters are invalid.',
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
          'Failed to verify authentication.',
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
          'Please sign in to continue.',
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
          'Please sign in to continue.',
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
          'Could not parse the request body.',
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
          'The campaign creation payload is invalid.',
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
          'Failed to verify authentication.',
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
          'Please sign in to continue.',
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
