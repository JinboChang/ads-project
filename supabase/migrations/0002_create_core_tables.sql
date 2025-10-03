-- 0002_create_core_tables.sql
-- Core tables and trigger definitions for Blocals Experience SaaS

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.touch_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type text NOT NULL CHECK (role_type IN ('influencer','advertiser')),
  full_name text NOT NULL,
  phone text NOT NULL,
  verification_method text NOT NULL CHECK (verification_method IN ('email','sms')),
  onboarding_status text NOT NULL DEFAULT 'pending' CHECK (onboarding_status IN ('pending','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.influencer_profiles (
  influencer_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  birth_date date NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  verification_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.influencer_channels (
  id bigserial PRIMARY KEY,
  influencer_id uuid NOT NULL REFERENCES public.influencer_profiles(influencer_id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube','instagram','naver','threads','tiktok')),
  channel_name text NOT NULL,
  channel_url text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (influencer_id, platform, channel_url)
);

CREATE TABLE IF NOT EXISTS public.advertiser_profiles (
  advertiser_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  company_name text NOT NULL,
  business_category text NOT NULL,
  business_reg_number text NOT NULL UNIQUE,
  location text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  verification_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id bigserial PRIMARY KEY,
  advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(advertiser_id) ON DELETE CASCADE,
  title text NOT NULL,
  application_start_at timestamptz NOT NULL,
  application_end_at timestamptz NOT NULL,
  benefit_summary text NOT NULL,
  mission_details text NOT NULL,
  store_location text NOT NULL,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  status text NOT NULL DEFAULT 'recruiting' CHECK (status IN ('draft','recruiting','recruitment_closed','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (application_start_at < application_end_at)
);

CREATE TABLE IF NOT EXISTS public.applications (
  id bigserial PRIMARY KEY,
  campaign_id bigint NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES public.influencer_profiles(influencer_id) ON DELETE CASCADE,
  motivation_note text NOT NULL,
  planned_visit_on date NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected','cancelled')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, influencer_id)
);

CREATE TABLE IF NOT EXISTS public.application_events (
  id bigserial PRIMARY KEY,
  application_id bigint NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  performed_by uuid NOT NULL REFERENCES public.profiles(user_id),
  event_type text NOT NULL CHECK (event_type IN ('submitted','status_changed','note_added')),
  from_status text,
  to_status text,
  context jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role_type ON public.profiles(role_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_status ON public.campaigns(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_influencer_status ON public.applications(influencer_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_campaign_status ON public.applications(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_application_events_application_recorded_at ON public.application_events(application_id, recorded_at DESC);

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_influencer_profiles ON public.influencer_profiles;
CREATE TRIGGER set_updated_at_influencer_profiles
  BEFORE UPDATE ON public.influencer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_influencer_channels ON public.influencer_channels;
CREATE TRIGGER set_updated_at_influencer_channels
  BEFORE UPDATE ON public.influencer_channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_advertiser_profiles ON public.advertiser_profiles;
CREATE TRIGGER set_updated_at_advertiser_profiles
  BEFORE UPDATE ON public.advertiser_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_campaigns ON public.campaigns;
CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_applications ON public.applications;
CREATE TRIGGER set_updated_at_applications
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_application_events ON public.application_events;
CREATE TRIGGER set_updated_at_application_events
  BEFORE UPDATE ON public.application_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS touch_status_updated_at_applications ON public.applications;
CREATE TRIGGER touch_status_updated_at_applications
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_status_updated_at();