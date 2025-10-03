import { z } from 'zod';
import {
  campaignSortValues,
  campaignStatusValues,
  CampaignListResponseSchema,
} from '@/features/campaigns/lib/dto';

export const CampaignListQuerySchema = z.object({
  status: z.enum(campaignStatusValues).optional(),
  sort: z.enum(campaignSortValues).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;

export const CampaignListResponseBodySchema = CampaignListResponseSchema;
