import { z } from 'zod';
import {
  CampaignDetailResponseSchema,
} from '@/features/campaigns/lib/dto';

export const CampaignDetailParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CampaignDetailParams = z.infer<typeof CampaignDetailParamsSchema>;

export const CampaignDetailResponseBodySchema =
  CampaignDetailResponseSchema;

export type CampaignDetailResponse = z.infer<
  typeof CampaignDetailResponseBodySchema
>;
