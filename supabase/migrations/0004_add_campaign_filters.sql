-- 0004_add_campaign_filters.sql
-- Introduce campaign category & region enums and related columns/indexes

DO $$
BEGIN
  BEGIN
    CREATE TYPE public.campaign_category AS ENUM (
      'food_beverage',
      'beauty',
      'lifestyle',
      'tech',
      'travel',
      'culture',
      'others'
    );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  BEGIN
    CREATE TYPE public.campaign_region AS ENUM (
      'seoul',
      'busan',
      'daegu',
      'incheon',
      'gwangju',
      'daejeon',
      'ulsan',
      'sejong',
      'gyeonggi',
      'gangwon',
      'chungbuk',
      'chungnam',
      'jeonbuk',
      'jeonnam',
      'gyeongbuk',
      'gyeongnam',
      'jeju',
      'nationwide'
    );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  BEGIN
    ALTER TABLE public.campaigns
      ADD COLUMN IF NOT EXISTS category public.campaign_category;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  BEGIN
    ALTER TABLE public.campaigns
      ADD COLUMN IF NOT EXISTS region public.campaign_region;
  EXCEPTION
    WHEN duplicate_column THEN
      NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_campaigns_category_status
      ON public.campaigns(category, status);
  EXCEPTION
    WHEN duplicate_table THEN
      NULL;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_campaigns_region_status
      ON public.campaigns(region, status);
  EXCEPTION
    WHEN duplicate_table THEN
      NULL;
  END;
END;
$$;