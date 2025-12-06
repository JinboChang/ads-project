"use client";

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  campaignStatusLabelMap,
  campaignStatusValues,
  type AdvertiserCampaignSummary,
  type CampaignStatus,
} from '@/features/campaigns/lib/dto';
import { CampaignSummaryCard } from '@/features/campaigns/admin/components/campaign-summary-card';

const filterOptions: Array<{ value: CampaignStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  ...campaignStatusValues.map((status) => ({
    value: status,
    label: campaignStatusLabelMap[status],
  })),
];

type CampaignAdminDashboardProps = {
  campaigns: AdvertiserCampaignSummary[];
  isLoading: boolean;
  errorMessage: string | null;
  selectedStatus: CampaignStatus | 'all';
  onStatusChange: (status: CampaignStatus | 'all') => void;
  onOpenCreateDialog: () => void;
  isCreateDisabled?: boolean;
};

export const CampaignAdminDashboard = ({
  campaigns,
  isLoading,
  errorMessage,
  selectedStatus,
  onStatusChange,
  onOpenCreateDialog,
  isCreateDisabled = false,
}: CampaignAdminDashboardProps) => {
  const filteredCampaigns = useMemo(() => {
    if (selectedStatus === 'all') {
      return campaigns;
    }

    return campaigns.filter((item) => item.status === selectedStatus);
  }, [campaigns, selectedStatus]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">Campaign management</h1>
          <p className="text-sm text-slate-600">Review your campaigns and create new ones.</p>
        </div>
        <Button
          onClick={onOpenCreateDialog}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          disabled={isCreateDisabled}
        >
          Create campaign
        </Button>
      </section>

      <section className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isActive = selectedStatus === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              onClick={() => onStatusChange(option.value)}
              className="rounded-full px-4 py-2 text-sm"
            >
              {option.label}
            </Button>
          );
        })}
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          <p className="font-medium">Could not load campaigns.</p>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-white" />
          <div className="h-40 animate-pulse rounded-3xl bg-white" />
          <div className="h-40 animate-pulse rounded-3xl bg-white" />
        </div>
      ) : null}

      {!isLoading && !errorMessage && filteredCampaigns.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-base font-medium text-slate-700">No campaigns yet.</p>
          <p className="text-sm text-slate-500">Create a campaign to start recruiting.</p>
          <Button
            type="button"
            onClick={onOpenCreateDialog}
            className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
            disabled={isCreateDisabled}
          >
            Create campaign
          </Button>
        </div>
      ) : null}

      {!isLoading && !errorMessage && filteredCampaigns.length > 0 ? (
        <div className="space-y-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignSummaryCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
