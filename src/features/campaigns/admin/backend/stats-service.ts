import type { SupabaseClient } from '@supabase/supabase-js';
import { applicationStatusValues } from '@/features/campaigns/lib/dto';
import type { AdvertiserCampaignStats } from '@/features/campaigns/lib/dto';

const APPLICATIONS_TABLE = 'applications';

const fallbackStats: AdvertiserCampaignStats = {
  totalApplicants: 0,
  submittedCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  cancelledCount: 0,
  lastApplicationAt: null,
};

const statusKeys = new Set(applicationStatusValues);

type ApplicationAggregateRow = {
  campaign_id: number;
  status: (typeof applicationStatusValues)[number];
  submitted_at: string;
  status_updated_at: string | null;
};

const toIsoStringOrNull = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const calculateStats = (
  rows: ApplicationAggregateRow[],
): Map<number, AdvertiserCampaignStats> => {
  const result = new Map<number, AdvertiserCampaignStats>();

  for (const row of rows) {
    if (!statusKeys.has(row.status)) {
      continue;
    }

    const current = result.get(row.campaign_id) ?? { ...fallbackStats };
    const submittedAt = toIsoStringOrNull(row.submitted_at);
    const statusUpdatedAt = toIsoStringOrNull(row.status_updated_at);
    const candidateTimestamp = statusUpdatedAt ?? submittedAt;

    result.set(row.campaign_id, {
      ...current,
      totalApplicants: current.totalApplicants + 1,
      submittedCount:
        row.status === 'submitted'
          ? current.submittedCount + 1
          : current.submittedCount,
      approvedCount:
        row.status === 'approved'
          ? current.approvedCount + 1
          : current.approvedCount,
      rejectedCount:
        row.status === 'rejected'
          ? current.rejectedCount + 1
          : current.rejectedCount,
      cancelledCount:
        row.status === 'cancelled'
          ? current.cancelledCount + 1
          : current.cancelledCount,
      lastApplicationAt: (() => {
        if (!candidateTimestamp) {
          return current.lastApplicationAt;
        }

        if (!current.lastApplicationAt) {
          return candidateTimestamp;
        }

        return candidateTimestamp > current.lastApplicationAt
          ? candidateTimestamp
          : current.lastApplicationAt;
      })(),
    });
  }

  return result;
};

export const fetchCampaignStatsMap = async (
  supabase: SupabaseClient,
  campaignIds: number[],
) => {
  if (campaignIds.length === 0) {
    return new Map<number, AdvertiserCampaignStats>();
  }

  const response = await supabase
    .from(APPLICATIONS_TABLE)
    .select('campaign_id, status, submitted_at, status_updated_at')
    .in('campaign_id', campaignIds)
    .returns<ApplicationAggregateRow[]>();

  if (response.error) {
    throw response.error;
  }

  const statsMap = calculateStats(response.data ?? []);

  for (const campaignId of campaignIds) {
    if (!statsMap.has(campaignId)) {
      statsMap.set(campaignId, { ...fallbackStats });
    }
  }

  return statsMap;
};

export const resetCampaignStats = () => ({ ...fallbackStats });
