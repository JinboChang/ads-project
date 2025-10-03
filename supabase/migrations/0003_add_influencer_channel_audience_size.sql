-- 0003_add_influencer_channel_audience_size.sql
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.influencer_channels
      ADD COLUMN IF NOT EXISTS audience_size bigint;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;
END $$;
