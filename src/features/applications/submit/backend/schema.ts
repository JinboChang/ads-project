import { z } from 'zod';

export const CampaignApplicationPayloadSchema = z.object({
  campaignId: z.number().int().positive(),
  motivationNote: z
    .string({ required_error: '각오 한마디를 입력해주세요.' })
    .min(10, '각오 한마디는 최소 10자 이상 입력해주세요.')
    .max(2000, '각오 한마디는 2000자를 초과할 수 없습니다.'),
  plannedVisitOn: z
    .string({ required_error: '방문 예정일을 입력해주세요.' })
    .refine((value) => {
      const parsed = new Date(value);
      return Number.isFinite(parsed.getTime());
    }, '올바른 방문 예정일을 입력해주세요.'),
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
