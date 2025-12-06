"use client";

import { CampaignCard } from '@/features/campaigns/browse/components/campaign-card';
import { useCampaignFilterStore } from '@/features/campaigns/browse/hooks/useCampaignFilters';
import { useCampaignListQuery } from '@/features/campaigns/browse/hooks/useCampaignListQuery';

const skeletonItems = Array.from({ length: 8 }, (_, index) => index);

export const CampaignList = () => {
  const { data, isLoading, isFetching, isError, error } = useCampaignListQuery();
  const { page, setPage } = useCampaignFilterStore((state) => ({
    page: state.page,
    setPage: state.setPage,
  }));

  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.totalCount / meta.pageSize)) : 1;

  const handlePrev = () => {
    setPage(Math.max(1, page - 1));
  };

  const handleNext = () => {
    if (meta?.hasMore === false) {
      return;
    }
    setPage(page + 1);
  };

  if (isLoading && !data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {skeletonItems.map((item) => (
          <div
            key={item}
            className="h-72 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error instanceof Error
          ? error.message
          : 'Failed to load campaign list.'}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No campaigns match your filters. Try adjusting them.
      </div>
    );
  }

  const resolvedMeta = data.meta;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
        {isFetching ? (
          <div className="hidden h-72 animate-pulse rounded-xl border border-slate-200 bg-slate-100 xl:block" />
        ) : null}
      </div>
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <div>
          Total {resolvedMeta.totalCount.toLocaleString()} · Page {page} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={page <= 1}
            className="rounded-md border border-slate-200 px-3 py-1 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!resolvedMeta.hasMore}
            className="rounded-md border border-slate-200 px-3 py-1 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
