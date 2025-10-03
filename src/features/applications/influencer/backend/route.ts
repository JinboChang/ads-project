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
          '로그인이 필요한 서비스입니다.',
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
          '지원 목록 조회 파라미터가 올바르지 않습니다.',
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
          '사용자 정보를 확인하지 못했습니다.',
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
          '로그인이 필요한 서비스입니다.',
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
