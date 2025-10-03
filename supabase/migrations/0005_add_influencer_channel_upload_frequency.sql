-- 0005_add_influencer_channel_upload_frequency.sql
-- Adds upload_frequency column to influencer_channels table

BEGIN;

ALTER TABLE public.influencer_channels
  ADD COLUMN IF NOT EXISTS upload_frequency text NOT NULL DEFAULT 'weekly';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'influencer_channels'
      AND constraint_name = 'influencer_channels_upload_frequency_check'
  ) THEN
    ALTER TABLE public.influencer_channels
      ADD CONSTRAINT influencer_channels_upload_frequency_check
      CHECK (upload_frequency IN ('daily','weekly','biweekly','monthly','occasionally'));
  END IF;
END $$;

UPDATE public.influencer_channels
SET upload_frequency = 'weekly'
WHERE upload_frequency NOT IN ('daily','weekly','biweekly','monthly','occasionally');

COMMIT;