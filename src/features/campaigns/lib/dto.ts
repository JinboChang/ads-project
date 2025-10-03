import { z } from 'zod';

export const campaignStatusValues = [
  'draft',
  'recruiting',
  'recruitment_closed',
  'completed',
] as const;

export type CampaignStatus = (typeof campaignStatusValues)[number];

export const campaignSortValues = ['recent', 'endingSoon'] as const;

export type CampaignSortOption = (typeof campaignSortValues)[number];

export const applicationStatusValues = [
  'submitted',
  'approved',
  'rejected',
  'cancelled',
] as const;

export type ApplicationStatus = (typeof applicationStatusValues)[number];

export const applicationStatusLabelMap: Record<ApplicationStatus, string> = {
  submitted: '신청완료',
  approved: '선정',
  rejected: '반려',
  cancelled: '취소',
} as const;

export const CampaignSummarySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  benefitSummary: z.string(),
  storeLocation: z.string().nullable(),
  status: z.enum(campaignStatusValues),
  applicationStartAt: z.string(),
  applicationEndAt: z.string(),
  maxParticipants: z.number().int(),
  createdAt: z.string(),
});

export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;

export const CampaignListMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalCount: z.number().int().min(0),
  hasMore: z.boolean(),
});

export type CampaignListMeta = z.infer<typeof CampaignListMetaSchema>;

export const CampaignListResponseSchema = z.object({
  items: z.array(CampaignSummarySchema),
  meta: CampaignListMetaSchema,
});

export type CampaignListResponse = z.infer<typeof CampaignListResponseSchema>;

export const campaignEligibilityReasonValues = [
  'eligible',
  'unauthenticated',
  'not_influencer',
  'profile_incomplete',
  'profile_not_verified',
  'already_applied',
  'campaign_closed',
  'outside_period',
  'quota_full',
] as const;

export type CampaignEligibilityReason =
  (typeof campaignEligibilityReasonValues)[number];

export const CampaignEligibilitySchema = z.object({
  isEligible: z.boolean(),
  reason: z.enum(campaignEligibilityReasonValues),
});

export type CampaignEligibility = z.infer<typeof CampaignEligibilitySchema>;

export const CampaignDetailSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  benefitSummary: z.string(),
  missionDetails: z.string(),
  storeLocation: z.string().nullable(),
  status: z.enum(campaignStatusValues),
  applicationStartAt: z.string(),
  applicationEndAt: z.string(),
  maxParticipants: z.number().int(),
  createdAt: z.string(),
});

export type CampaignDetail = z.infer<typeof CampaignDetailSchema>;

export const CampaignDetailStatsSchema = z.object({
  totalApplicants: z.number().int().min(0),
  approvedCount: z.number().int().min(0),
  remainingSlots: z.number().int().min(0),
});

export type CampaignDetailStats = z.infer<typeof CampaignDetailStatsSchema>;

export const CampaignDetailResponseSchema = z.object({
  campaign: CampaignDetailSchema,
  stats: CampaignDetailStatsSchema,
  eligibility: CampaignEligibilitySchema,
  userApplicationStatus: z.enum(applicationStatusValues).nullable(),
});

export type CampaignDetailResponse = z.infer<typeof CampaignDetailResponseSchema>;

export const campaignStatusLabelMap: Record<CampaignStatus, string> = {
  draft: '초안',
  recruiting: '모집중',
  recruitment_closed: '모집 종료',
  completed: '완료',
} as const;

export const AdvertiserCampaignStatsSchema = z.object({
  totalApplicants: z.number().int().min(0),
  submittedCount: z.number().int().min(0),
  approvedCount: z.number().int().min(0),
  rejectedCount: z.number().int().min(0),
  cancelledCount: z.number().int().min(0),
  lastApplicationAt: z.string().nullable(),
});

export type AdvertiserCampaignStats = z.infer<typeof AdvertiserCampaignStatsSchema>;

export const AdvertiserCampaignSummarySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  benefitSummary: z.string().nullable(),
  missionDetails: z.string().nullable(),
  storeLocation: z.string().nullable(),
  status: z.enum(campaignStatusValues),
  applicationStartAt: z.string(),
  applicationEndAt: z.string(),
  maxParticipants: z.number().int().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  stats: AdvertiserCampaignStatsSchema,
});

export type AdvertiserCampaignSummary = z.infer<typeof AdvertiserCampaignSummarySchema>;

export const AdvertiserCampaignListResponseSchema = z.object({
  items: z.array(AdvertiserCampaignSummarySchema),
});

export type AdvertiserCampaignListResponse = z.infer<
  typeof AdvertiserCampaignListResponseSchema
>;

const campaignTitleSchema = z.string().min(1).max(120);
const campaignTextSchema = z.string().min(1).max(5000);
const campaignOptionalTextSchema = z.string().max(5000).optional().nullable();

export const AdvertiserCampaignCreateInputSchema = z
  .object({
    title: campaignTitleSchema,
    benefitSummary: z.string().min(1).max(500),
    missionDetails: campaignTextSchema,
    storeLocation: campaignOptionalTextSchema,
    applicationStartAt: z.string(),
    applicationEndAt: z.string(),
    maxParticipants: z.number().int().min(1).max(100000),
  })
  .refine(
    (value) => {
      const start = new Date(value.applicationStartAt);
      const end = new Date(value.applicationEndAt);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return false;
      }

      return start.getTime() < end.getTime();
    },
  {
    message: '모집 종료일은 시작일 이후여야 합니다.',
    path: ['applicationEndAt'],
  },
);

export type AdvertiserCampaignCreateInput = z.infer<
  typeof AdvertiserCampaignCreateInputSchema
>;

export const CampaignDateRangeSchema = z
  .object({
    applicationStartAt: z.string(),
    applicationEndAt: z.string(),
  })
  .refine(
    (value) => {
      const start = new Date(value.applicationStartAt);
      const end = new Date(value.applicationEndAt);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return false;
      }

      return start.getTime() < end.getTime();
    },
    {
      message: '모집 종료일은 시작일 이후여야 합니다.',
      path: ['applicationEndAt'],
    },
  );

export type CampaignDateRange = z.infer<typeof CampaignDateRangeSchema>;

export const CloseCampaignRequestSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export type CloseCampaignRequest = z.infer<typeof CloseCampaignRequestSchema>;

export const ApproveApplicantsRequestSchema = z.object({
  applicantIds: z.array(z.number().int()).min(1),
  note: z.string().max(1000).optional().nullable(),
  autoRejectRemaining: z.boolean().optional(),
});

export type ApproveApplicantsRequest = z.infer<
  typeof ApproveApplicantsRequestSchema
>;

export const ReopenCampaignRequestSchema = z
  .object({
    applicationStartAt: z.string().optional(),
    applicationEndAt: z.string().optional(),
  })
  .refine(
    (value) => {
      if (!value.applicationStartAt && !value.applicationEndAt) {
        return true;
      }

      if (value.applicationStartAt && value.applicationEndAt) {
        const rangeCheck = CampaignDateRangeSchema.safeParse({
          applicationStartAt: value.applicationStartAt,
          applicationEndAt: value.applicationEndAt,
        });

        return rangeCheck.success;
      }

      return false;
    },
    {
      message: '모집 시작일과 종료일을 모두 입력해야 합니다.',
      path: ['applicationStartAt'],
    },
  );

export type ReopenCampaignRequest = z.infer<typeof ReopenCampaignRequestSchema>;
