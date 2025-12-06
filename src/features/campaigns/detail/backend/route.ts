import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  CampaignDetailParamsSchema,
} from '@/features/campaigns/detail/backend/schema';
import {
  campaignDetailErrorCodes,
} from '@/features/campaigns/detail/backend/error';
import { getCampaignDetail } from '@/features/campaigns/detail/backend/service';

const extractAccessToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1] ?? null : null;
};

export const registerCampaignDetailRoutes = (app: Hono<AppEnv>) => {
  app.get('/campaigns/:id', async (c) => {
    const params = CampaignDetailParamsSchema.safeParse({ id: c.req.param('id') });

    if (!params.success) {
      return respond(
        c,
        failure(
          400,
          campaignDetailErrorCodes.invalidParams,
          'The campaign detail request parameters are invalid.',
          params.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const token = extractAccessToken(c.req.header('authorization'));

    let userId: string | null = null;

    if (token) {
      const userResult = await supabase.auth.getUser(token);

      if (!userResult.error && userResult.data.user) {
        userId = userResult.data.user.id;
      }
    }

    const result = await getCampaignDetail(
      supabase,
      logger,
      params.data.id,
      userId ? { id: userId } : null,
    );

    return respond(c, result);
  });
};
