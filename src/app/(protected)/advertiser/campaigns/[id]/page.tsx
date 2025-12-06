"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { CampaignDetailOverview } from "@/features/campaigns/admin/detail/components/campaign-detail-overview";
import { ApplicantStatusTabs } from "@/features/campaigns/admin/detail/components/applicant-status-tabs";
import { ApplicantTable } from "@/features/campaigns/admin/detail/components/applicant-table";
import { ManageApplicantsDialog } from "@/features/campaigns/admin/detail/components/manage-applicants-dialog";
import { useAdvertiserCampaignDetailQuery } from "@/features/campaigns/admin/detail/hooks/useAdvertiserCampaignDetailQuery";
import { useCloseCampaignMutation } from "@/features/campaigns/admin/detail/hooks/useCloseCampaignMutation";
import { useApproveApplicantsMutation } from "@/features/campaigns/admin/detail/hooks/useApproveApplicantsMutation";
import { useReopenCampaignMutation } from "@/features/campaigns/admin/detail/hooks/useReopenCampaignMutation";
import {
  type AdvertiserApplicantStatusFilter,
  applicationStatusLabelMap,
} from "@/features/applications/lib/dto";

export type AdvertiserCampaignDetailPageParams = Promise<{ id: string }>;

type AdvertiserCampaignDetailPageProps = {
  params: AdvertiserCampaignDetailPageParams;
};

const getRoleType = (
  user?: {
    userMetadata?: Record<string, unknown>;
    appMetadata?: Record<string, unknown>;
  } | null,
) => {
  if (!user) {
    return undefined;
  }

  const sources = [user.userMetadata, user.appMetadata];
  for (const source of sources) {
    const value = source?.roleType ?? source?.role_type;
    if (typeof value === "string") {
      return value;
    }
  }

  return undefined;
};

const statusFilterLabels: Record<AdvertiserApplicantStatusFilter, string> = {
  all: "All",
  submitted: applicationStatusLabelMap.submitted,
  approved: applicationStatusLabelMap.approved,
  rejected: applicationStatusLabelMap.rejected,
  cancelled: applicationStatusLabelMap.cancelled,
};

const AdvertiserCampaignDetailPage = ({ params }: AdvertiserCampaignDetailPageProps) => {
  void params;

  const { toast } = useToast();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const roleType = getRoleType(user);
  const routeParams = useParams<{ id: string }>();
  const campaignIdRaw = Number(routeParams?.id ?? "");
  const isValidCampaignId = Number.isFinite(campaignIdRaw) && campaignIdRaw > 0;
  const campaignId = isValidCampaignId ? campaignIdRaw : null;

  const [statusFilter, setStatusFilter] = useState<AdvertiserApplicantStatusFilter>("all");
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<number[]>([]);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  const isAdvertiser = roleType === "advertiser";
  const isReady = isAuthenticated && isAdvertiser && campaignId !== null;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login?redirectedFrom=/advertiser/campaigns");
      return;
    }

    if (!isAdvertiser || !isValidCampaignId) {
      router.replace("/");
    }
  }, [isAuthenticated, isAdvertiser, isLoading, isValidCampaignId, router]);

  const detailQuery = useAdvertiserCampaignDetailQuery(campaignId, {
    enabled: isReady,
  });

  const closeMutation = useCloseCampaignMutation(campaignId ?? 0);
  const approveMutation = useApproveApplicantsMutation(campaignId ?? 0);
  const reopenMutation = useReopenCampaignMutation(campaignId ?? 0);

  const campaign = detailQuery.data?.campaign ?? null;
  const applicants = useMemo(() => detailQuery.data?.applicants ?? [], [detailQuery.data]);

  const counts = useMemo(
    () => ({
      submitted: campaign?.stats.submittedCount ?? 0,
      approved: campaign?.stats.approvedCount ?? 0,
      rejected: campaign?.stats.rejectedCount ?? 0,
      cancelled: campaign?.stats.cancelledCount ?? 0,
    }),
    [campaign],
  );

  const filteredApplicants = useMemo(() => {
    if (statusFilter === "all") {
      return applicants;
    }

    return applicants.filter((item) => item.status === statusFilter);
  }, [applicants, statusFilter]);

  const selectedSet = useMemo(() => new Set(selectedApplicantIds), [selectedApplicantIds]);

  const resetSelection = useCallback(() => {
    setSelectedApplicantIds([]);
  }, []);

  useEffect(() => {
    if (!campaign || campaign.status !== "recruitment_closed") {
      resetSelection();
    }
  }, [campaign, resetSelection]);

  const selectableApplicants = useMemo(
    () => applicants.filter((item) => item.status === "submitted"),
    [applicants],
  );

  const handleToggleApplicant = useCallback((applicantId: number) => {
    setSelectedApplicantIds((prev) => {
      if (prev.includes(applicantId)) {
        return prev.filter((id) => id !== applicantId);
      }
      return [...prev, applicantId];
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    const selectableIds = selectableApplicants.map((item) => item.id);
    const allSelected = selectableIds.every((id) => selectedSet.has(id));

    if (allSelected) {
      setSelectedApplicantIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    } else {
      setSelectedApplicantIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
    }
  }, [selectableApplicants, selectedSet]);

  const handleCloseCampaign = useCallback(async () => {
    if (!campaignId) {
      return;
    }

    const confirmed = window.confirm(
      "Close recruiting? New applications will no longer be accepted.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await closeMutation.mutateAsync({});
      toast({
        title: "Recruiting closed.",
        description: "Proceed to approve applicants from the list.",
      });
    } catch (error) {
      toast({
        title: "Failed to close recruiting.",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }, [campaignId, closeMutation, toast]);

  const handleReopenCampaign = useCallback(async () => {
    if (!campaignId) {
      return;
    }

    const confirmed = window.confirm(
      "Reopen recruiting? Influencers will be able to apply again.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await reopenMutation.mutateAsync({});
      toast({ title: "Recruiting reopened." });
    } catch (error) {
      toast({
        title: "Failed to reopen recruiting.",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }, [campaignId, reopenMutation, toast]);

  const handleApproveApplicants = useCallback(
    async (options: { note: string | null }) => {
      if (!campaignId || selectedApplicantIds.length === 0) {
        return;
      }

      try {
        await approveMutation.mutateAsync({
          applicantIds: selectedApplicantIds,
          note: options.note,
        });
        toast({ title: "Selection completed." });
        resetSelection();
        setIsManageDialogOpen(false);
      } catch (error) {
        toast({
          title: "Failed to approve applicants.",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    },
    [approveMutation, campaignId, resetSelection, selectedApplicantIds, toast],
  );

  const isSelectionEnabled = Boolean(campaign && campaign.status === "recruitment_closed");

  if (!isValidCampaignId) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-800">Invalid campaign ID.</p>
        </div>
      </main>
    );
  }

  if (isLoading || !isReady) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="h-9 w-44 animate-pulse rounded-full bg-slate-200" />
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
          <div className="h-40 animate-pulse rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  if (detailQuery.isError) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-200 bg-rose-50 p-12 text-center text-sm text-rose-600">
          <p className="text-lg font-semibold">Failed to load campaign information.</p>
          <p className="mt-2">{detailQuery.error?.message ?? "Please try again."}</p>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-800">Campaign not found.</p>
        </div>
      </main>
    );
  }

  const selectedApplicants = applicants.filter((item) => selectedSet.has(item.id));
  const showCloseAction = campaign.status === "recruiting";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <CampaignDetailOverview
          campaign={campaign}
          onCloseCampaign={showCloseAction ? handleCloseCampaign : undefined}
          onReopenCampaign={handleReopenCampaign}
          isCloseDisabled={closeMutation.isPending}
          isReopenDisabled={reopenMutation.isPending}
        />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ApplicantStatusTabs
              selected={statusFilter}
              onSelect={(status) => {
                setStatusFilter(status);
                resetSelection();
              }}
              counts={counts}
            />
            <div className="text-sm text-slate-500">Current filter: {statusFilterLabels[statusFilter]}</div>
          </div>
          <ApplicantTable
            applicants={filteredApplicants}
            selectedIds={selectedSet}
            onToggleApplicant={handleToggleApplicant}
            onToggleAll={handleToggleAll}
            selectionEnabled={isSelectionEnabled}
            isApplicantSelectable={(applicant) => applicant.status === "submitted"}
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400"
              onClick={() => detailQuery.refetch()}
            >
              Refresh
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={() => setIsManageDialogOpen(true)}
              disabled={!isSelectionEnabled || selectedApplicantIds.length === 0 || approveMutation.isPending}
            >
              Approve selected
            </button>
          </div>
        </section>
      </div>
      <ManageApplicantsDialog
        open={isManageDialogOpen}
        applicants={selectedApplicants}
        onOpenChange={(next) => {
          if (!next) {
            setIsManageDialogOpen(false);
          }
        }}
        onConfirm={handleApproveApplicants}
        isSubmitting={approveMutation.isPending}
      />
    </main>
  );
};

export default AdvertiserCampaignDetailPage;
