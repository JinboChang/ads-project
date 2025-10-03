import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerOnboardingRoutes } from '@/features/onboarding/backend/route';
import { registerInfluencerRoutes } from '@/features/influencer/backend/route';
import { registerAdvertiserRoutes } from '@/features/advertiser/backend/route';
import { registerCampaignBrowseRoutes } from '@/features/campaigns/browse/backend/route';
import { registerCampaignDetailRoutes } from '@/features/campaigns/detail/backend/route';
import { registerCampaignApplicationRoutes } from '@/features/applications/submit/backend/route';
import { registerInfluencerApplicationRoutes } from '@/features/applications/influencer/backend/route';
import { registerAdvertiserCampaignAdminRoutes } from '@/features/campaigns/admin/backend/route';
import { registerAdvertiserCampaignDetailRoutes } from '@/features/campaigns/admin/detail/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const rootApp = new Hono<AppEnv>();
  const apiApp = new Hono<AppEnv>();

  apiApp.use('*', errorBoundary());
  apiApp.use('*', withAppContext());
  apiApp.use('*', withSupabase());

  registerExampleRoutes(apiApp);
  registerOnboardingRoutes(apiApp);
  registerInfluencerRoutes(apiApp);
  registerAdvertiserRoutes(apiApp);
  registerCampaignBrowseRoutes(apiApp);
  registerCampaignDetailRoutes(apiApp);
  registerCampaignApplicationRoutes(apiApp);
  registerInfluencerApplicationRoutes(apiApp);
  registerAdvertiserCampaignAdminRoutes(apiApp);
  registerAdvertiserCampaignDetailRoutes(apiApp);

  rootApp.route('/api', apiApp);

  singletonApp = rootApp;

  return rootApp;
};
