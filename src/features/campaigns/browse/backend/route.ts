import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { CampaignListQuerySchema } from '@/features/campaigns/browse/backend/schema';
import { campaignBrowseErrorCodes } from '@/features/campaigns/browse/backend/error';
import { listCampaigns } from '@/features/campaigns/browse/backend/service';

const toQueryObject = (queries: Record<string, string[]>) => {
  const entries = Object.entries(queries).map(([key, values]) => [
    key,
    values[values.length - 1] ?? '',
  ]);
  return Object.fromEntries(entries) as Record<string, string>;
};

export const registerCampaignBrowseRoutes = (app: Hono<AppEnv>) => {
  app.get('/campaigns', async (c) => {
    const queryObject = toQueryObject(c.req.queries());
    const parsed = CampaignListQuerySchema.safeParse(queryObject);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          campaignBrowseErrorCodes.invalidQuery,
          '체험단 목록 요청 값이 유효하지 않습니다.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await listCampaigns(supabase, parsed.data);

    return respond(c, result);
  });
};
