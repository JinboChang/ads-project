import { z } from 'zod';

export const CampaignApplicationPayloadSchema = z.object({
  campaignId: z.number().int().positive(),
  motivationNote: z
    .string({ required_error: 'Please enter a motivation note.' })
    .min(10, 'Motivation must be at least 10 characters.')
    .max(2000, 'Motivation cannot exceed 2000 characters.'),
  plannedVisitOn: z
    .string({ required_error: 'Please enter a planned visit date.' })
    .refine((value) => {
      const parsed = new Date(value);
      return Number.isFinite(parsed.getTime());
    }, 'Please enter a valid planned visit date.'),
});

export type CampaignApplicationPayload = z.infer<
  typeof CampaignApplicationPayloadSchema
>;

export const CampaignApplicationResponseSchema = z.object({
  applicationId: z.number().int(),
  status: z.literal('submitted'),
  submittedAt: z.string(),
});

export type CampaignApplicationResponse = z.infer<
  typeof CampaignApplicationResponseSchema
>;
