import { z } from 'zod';
import {
  applicationStatusValues,
  campaignStatusValues,
} from '@/features/campaigns/lib/dto';

export const myApplicationStatusFilterValues = ['all', ...applicationStatusValues] as const;

type ApplicationStatus = (typeof applicationStatusValues)[number];
export type MyApplicationStatusFilter =
  (typeof myApplicationStatusFilterValues)[number];

export const applicationStatusLabelMap: Record<ApplicationStatus, string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
} as const;

export const myApplicationStatusLabelMap: Record<MyApplicationStatusFilter, string> = {
  all: 'All',
  submitted: applicationStatusLabelMap.submitted,
  approved: applicationStatusLabelMap.approved,
  rejected: applicationStatusLabelMap.rejected,
  cancelled: applicationStatusLabelMap.cancelled,
} as const;

export const MyApplicationSummarySchema = z.object({
  id: z.number().int(),
  campaignId: z.number().int(),
  campaignTitle: z.string(),
  campaignStatus: z.enum(campaignStatusValues),
  campaignApplicationEndAt: z.string().nullable(),
  benefitSummary: z.string().nullable(),
  appliedAt: z.string(),
  plannedVisitOn: z.string().nullable(),
  status: z.enum(applicationStatusValues),
  statusUpdatedAt: z.string().nullable(),
  latestNote: z.string().nullable(),
});

export type MyApplicationSummary = z.infer<typeof MyApplicationSummarySchema>;

export const MyApplicationsResponseSchema = z.object({
  items: z.array(MyApplicationSummarySchema),
});

export type MyApplicationsResponse = z.infer<typeof MyApplicationsResponseSchema>;

export const advertiserApplicantStatusFilterValues = [
  'all',
  ...applicationStatusValues,
] as const;

export type AdvertiserApplicantStatusFilter =
  (typeof advertiserApplicantStatusFilterValues)[number];

export const AdvertiserApplicantSummaryChannelSchema = z.object({
  platform: z.string(),
  channelName: z.string().nullable(),
  channelUrl: z.string().nullable(),
});

export type AdvertiserApplicantSummaryChannel = z.infer<
  typeof AdvertiserApplicantSummaryChannelSchema
>;

export const AdvertiserApplicantSummarySchema = z.object({
  id: z.number().int(),
  influencerId: z.string(),
  influencerName: z.string(),
  influencerEmail: z.string().nullable(),
  status: z.enum(applicationStatusValues),
  submittedAt: z.string(),
  statusUpdatedAt: z.string().nullable(),
  plannedVisitOn: z.string().nullable(),
  motivationNote: z.string().nullable(),
  latestNote: z.string().nullable(),
  channels: z.array(AdvertiserApplicantSummaryChannelSchema),
});

export type AdvertiserApplicantSummary = z.infer<
  typeof AdvertiserApplicantSummarySchema
>;

export const AdvertiserApplicantListResponseSchema = z.object({
  items: z.array(AdvertiserApplicantSummarySchema),
});

export type AdvertiserApplicantListResponse = z.infer<
  typeof AdvertiserApplicantListResponseSchema
>;
