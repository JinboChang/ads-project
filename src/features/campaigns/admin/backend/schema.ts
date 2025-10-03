import { z } from 'zod';
import {
  AdvertiserCampaignCreateInputSchema,
  AdvertiserCampaignListResponseSchema,
  AdvertiserCampaignSummarySchema,
  campaignStatusValues,
} from '@/features/campaigns/lib/dto';

export const AdvertiserCampaignListQuerySchema = z.object({
  status: z.enum(campaignStatusValues).optional(),
});

export type AdvertiserCampaignListQuery = z.infer<
  typeof AdvertiserCampaignListQuerySchema
>;

export const AdvertiserCampaignCreateSchema = AdvertiserCampaignCreateInputSchema;
export type AdvertiserCampaignCreateInput = z.infer<
  typeof AdvertiserCampaignCreateSchema
>;

export { AdvertiserCampaignListResponseSchema, AdvertiserCampaignSummarySchema };
