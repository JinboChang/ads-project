"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { CampaignAdminDashboard } from '@/features/campaigns/admin/components/campaign-admin-dashboard';
import { CampaignCreateDialog } from '@/features/campaigns/admin/components/campaign-create-dialog';
import { useAdvertiserCampaignsQuery } from '@/features/campaigns/admin/hooks/useAdvertiserCampaignsQuery';
import {
  campaignStatusValues,
  type AdvertiserCampaignCreateInput,
  type CampaignStatus,
} from '@/features/campaigns/lib/dto';

export type AdvertiserCampaignsPageParams = Promise<Record<string, never>>;

type AdvertiserCampaignsPageProps = {
  params: AdvertiserCampaignsPageParams;
};

const advertiserStatusFilterValues: Array<CampaignStatus | 'all'> = [
  'all',
  ...campaignStatusValues,
];

const getRoleType = (
  user?: {
    userMetadata?: Record<string, unknown>;
    appMetadata?: Record<string, unknown>;
  } | null,
) => {
  const sources = [user?.userMetadata, user?.appMetadata];
  for (const source of sources) {
    const value = source?.roleType ?? source?.role_type;
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

const AdvertiserCampaignsPage = ({ params }: AdvertiserCampaignsPageProps) => {
  void params;

  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const roleType = getRoleType(user);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');

  const isAdvertiser = roleType === 'advertiser';
  const isReady = isAuthenticated && isAdvertiser;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login?redirectedFrom=/advertiser/campaigns');
      return;
    }

    if (!isAdvertiser) {
      router.replace('/');
    }
  }, [isAuthenticated, isAdvertiser, isLoading, router]);

  const queryParams = useMemo(() => {
    if (statusFilter === 'all') {
      return undefined;
    }

    return { status: statusFilter } as const;
  }, [statusFilter]);

  const campaignsQuery = useAdvertiserCampaignsQuery(queryParams, {
    enabled: isReady,
  });

  const handleDialogOpenChange = useCallback((next: boolean) => {
    setIsCreateOpen(next);
  }, []);

  const handleCampaignCreated = useCallback(
    (_created?: AdvertiserCampaignCreateInput) => {
      void campaignsQuery.refetch();
    },
    [campaignsQuery],
  );

  if (isLoading || !isReady) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="h-9 w-44 animate-pulse rounded-full bg-slate-200" />
          <div className="h-36 rounded-3xl bg-slate-200" />
          <div className="h-36 rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  const campaigns = campaignsQuery.data?.items ?? [];
  const errorMessage = campaignsQuery.error?.message ?? null;
  const errorCode = (campaignsQuery.error as (Error & { code?: string }))?.code;
  const disableCreate = errorCode === 'advertiser_campaign_admin_profile_unverified';

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <CampaignAdminDashboard
          campaigns={campaigns}
          isLoading={campaignsQuery.isLoading}
          errorMessage={errorMessage}
          selectedStatus={statusFilter}
          onStatusChange={(nextStatus) => {
            if (!advertiserStatusFilterValues.includes(nextStatus)) {
              return;
            }
            setStatusFilter(nextStatus);
          }}
          onOpenCreateDialog={() => {
            if (disableCreate) {
              return;
            }
            setIsCreateOpen(true);
          }}
          isCreateDisabled={disableCreate}
        />
      </div>
      <CampaignCreateDialog
        open={isCreateOpen}
        onOpenChange={handleDialogOpenChange}
        onCreated={handleCampaignCreated}
      />
    </main>
  );
};

export default AdvertiserCampaignsPage;
