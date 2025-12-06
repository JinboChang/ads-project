"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { MyApplicationsFilter } from '@/features/applications/influencer/components/my-applications-filter';
import { MyApplicationsList } from '@/features/applications/influencer/components/my-applications-list';
import { useMyApplicationsQuery } from '@/features/applications/influencer/hooks/useMyApplicationsQuery';
import {
  myApplicationStatusLabelMap,
  type MyApplicationStatusFilter,
} from '@/features/applications/lib/dto';

export type InfluencerApplicationsPageParams = Promise<Record<string, never>>;

type InfluencerApplicationsPageProps = {
  params: InfluencerApplicationsPageParams;
};

const getRoleType = (userMetadata?: Record<string, unknown>) => {
  const value = userMetadata?.roleType ?? userMetadata?.role_type;
  return typeof value === 'string' ? value : undefined;
};

const InfluencerApplicationsPage = ({ params }: InfluencerApplicationsPageProps) => {
  void params;

  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const roleType = getRoleType(user);
  const [statusFilter, setStatusFilter] = useState<MyApplicationStatusFilter>('all');
  const applicationsQuery = useMyApplicationsQuery(statusFilter);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login?redirectedFrom=/influencer/applications');
      return;
    }

    if (roleType !== 'influencer') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, roleType, router]);

  const isReady = isAuthenticated && roleType === 'influencer';

  const selectedLabel = useMemo(
    () => myApplicationStatusLabelMap[statusFilter],
    [statusFilter],
  );

  if (isLoading || !isReady) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="h-9 w-44 animate-pulse rounded-full bg-slate-200" />
          <div className="h-32 rounded-3xl bg-slate-200" />
          <div className="h-32 rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-800">Please sign in to use this page.</p>
        </div>
      </main>
    );
  }

  if (roleType !== 'influencer') {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-800">This page is for influencers only.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">My applications</h1>
            <p className="text-sm text-slate-600">Current status: {selectedLabel}</p>
          </div>
          <MyApplicationsFilter value={statusFilter} onChange={setStatusFilter} />
        </section>

        <section className="space-y-4">
          {applicationsQuery.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
              <p className="font-medium">Failed to load your applications.</p>
              <p>{applicationsQuery.error?.message ?? 'Please try again.'}</p>
              <button
                type="button"
                onClick={() => applicationsQuery.refetch()}
                className="mt-3 inline-flex items-center rounded-full border border-rose-200 px-4 py-2 text-xs font-medium text-rose-600 transition hover:border-rose-400"
              >
                Retry
              </button>
            </div>
          ) : null}

          {applicationsQuery.isLoading ? (
            <div className="space-y-4">
              <div className="h-36 animate-pulse rounded-3xl bg-white" />
              <div className="h-36 animate-pulse rounded-3xl bg-white" />
              <div className="h-36 animate-pulse rounded-3xl bg-white" />
            </div>
          ) : null}

          {applicationsQuery.data ? (
            <MyApplicationsList items={applicationsQuery.data.items} />
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default InfluencerApplicationsPage;
