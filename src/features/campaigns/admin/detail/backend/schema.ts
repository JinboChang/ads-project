import { z } from 'zod';
import {
  AdvertiserApplicantSummarySchema,
  AdvertiserApplicantListResponseSchema,
} from '@/features/applications/lib/dto';
import {
  AdvertiserCampaignSummarySchema,
  ApproveApplicantsRequestSchema,
  CloseCampaignRequestSchema,
  ReopenCampaignRequestSchema,
} from '@/features/campaigns/lib/dto';

export const AdvertiserCampaignDetailParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type AdvertiserCampaignDetailParams = z.infer<
  typeof AdvertiserCampaignDetailParamsSchema
>;

export const AdvertiserCampaignDetailResponseSchema = z.object({
  campaign: AdvertiserCampaignSummarySchema,
  applicants: z.array(AdvertiserApplicantSummarySchema),
});

export type AdvertiserCampaignDetailResponse = z.infer<
  typeof AdvertiserCampaignDetailResponseSchema
>;

export const CampaignApplicantsResponseSchema = AdvertiserApplicantListResponseSchema;

export type CampaignApplicantsResponse = z.infer<
  typeof CampaignApplicantsResponseSchema
>;

export { CloseCampaignRequestSchema, ApproveApplicantsRequestSchema, ReopenCampaignRequestSchema };

export const CampaignWorkflowResultSchema = z.object({
  campaign: AdvertiserCampaignSummarySchema,
});

export type CampaignWorkflowResult = z.infer<typeof CampaignWorkflowResultSchema>;
