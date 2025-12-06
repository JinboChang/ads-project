import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  influencerApplicationsErrorCodes,
} from '@/features/applications/influencer/backend/error';
import {
  InfluencerApplicationsQuerySchema,
} from '@/features/applications/influencer/backend/schema';
import { getInfluencerApplications } from '@/features/applications/influencer/backend/service';

const extractAccessToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1] ?? null : null;
};

export const registerInfluencerApplicationRoutes = (app: Hono<AppEnv>) => {
  app.get('/influencers/applications', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const token = extractAccessToken(c.req.header('authorization'));

    if (!token) {
      return respond(
        c,
        failure(
          401,
          influencerApplicationsErrorCodes.unauthorized,
          'Please sign in to use this service.',
        ),
      );
    }

    const queryParams = InfluencerApplicationsQuerySchema.safeParse({
      status: c.req.query('status') ?? undefined,
    });

    if (!queryParams.success) {
      return respond(
        c,
        failure(
          400,
          influencerApplicationsErrorCodes.invalidParams,
          'The application list query parameters are invalid.',
          queryParams.error.format(),
        ),
      );
    }

    const userResult = await supabase.auth.getUser(token);

    if (userResult.error) {
      logger.error('Failed to resolve user for influencer applications', userResult.error);
      return respond(
        c,
        failure(
          500,
          influencerApplicationsErrorCodes.supabaseFailure,
          'Failed to verify user information.',
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
          influencerApplicationsErrorCodes.unauthorized,
          'Please sign in to use this service.',
        ),
      );
    }

    const statusFilter = queryParams.data.status;
    const result = await getInfluencerApplications(
      supabase,
      logger,
      user.id,
      statusFilter && statusFilter !== 'all' ? statusFilter : null,
    );

    return respond(c, result);
  });
};
