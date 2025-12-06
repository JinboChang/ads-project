"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useInfluencerProfileQuery } from "@/features/influencer/hooks/useInfluencerProfileQuery";
import { useAdvertiserProfileQuery } from "@/features/advertiser/hooks/useAdvertiserProfileQuery";
import { useMyApplicationsQuery } from "@/features/applications/influencer/hooks/useMyApplicationsQuery";
import { ApplicationStatusBadge } from "@/features/applications/influencer/components/application-status-badge";
import { applicationStatusLabelMap } from "@/features/applications/lib/dto";
import type { ApplicationStatus } from "@/features/campaigns/lib/dto";

export type DashboardPageParams = Promise<Record<string, never>>;

type DashboardPageProps = {
  params: DashboardPageParams;
};

const getRoleType = (metadata?: Record<string, unknown>) => {
  const value = metadata?.roleType ?? metadata?.role_type;
  return typeof value === "string" ? value : undefined;
};

const statusOrder: ApplicationStatus[] = [
  "submitted",
  "approved",
  "rejected",
  "cancelled",
];

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return format(parsed, "yyyy.MM.dd");
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { user } = useCurrentUser();
  const roleType = getRoleType(user?.userMetadata);
  const isInfluencer = roleType === "influencer";
  const isAdvertiser = roleType === "advertiser";

  const { data: influencerProfile } = useInfluencerProfileQuery({
    enabled: isInfluencer,
  });
  const { data: advertiserProfile } = useAdvertiserProfileQuery({
    enabled: isAdvertiser,
  });
  const myApplicationsQuery = useMyApplicationsQuery("all", {
    enabled: isInfluencer,
  });

  const onboardingStatus = influencerProfile?.onboardingStatus ?? "pending";
  const shouldCompleteInfluencerOnboarding = isInfluencer && onboardingStatus === "pending";
  const advertiserVerificationStatus = advertiserProfile?.verificationStatus ?? "pending";
  const shouldCompleteAdvertiserOnboarding =
    isAdvertiser && advertiserVerificationStatus !== "approved";
  const canManageCampaigns = isAdvertiser && advertiserVerificationStatus === "approved";

  const applicationItems = myApplicationsQuery.data?.items ?? [];
  const applicationCounts = statusOrder.reduce(
    (acc, status) => {
      acc[status] = applicationItems.filter((item) => item.status === status).length;
      return acc;
    },
    Object.fromEntries(statusOrder.map((status) => [status, 0])) as Record<ApplicationStatus, number>,
  );
  const totalApplications = applicationItems.length;
  const latestApplications = applicationItems.slice(0, 3);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          {user?.email ? `Welcome, ${user.email}.` : "Loading your account..."}
        </p>
      </header>

      {shouldCompleteInfluencerOnboarding ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-medium text-amber-900">Complete onboarding by adding your channel info.</h2>
          <p className="mt-2 text-sm text-amber-800">
            Add your channel details to start applying right away.
          </p>
          <div className="mt-4">
            <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
              <Link href="/influencer/profile">Add channel info</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {shouldCompleteAdvertiserOnboarding ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-medium text-emerald-900">Add your business info and start recruiting.</h2>
          <p className="mt-2 text-sm text-emerald-800">
            Save your business details to unlock campaign recruiting immediately. Our team may review it afterward, so please enter accurate information.
          </p>
          <div className="mt-4">
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Link href="/advertiser/profile">Add business info</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {isInfluencer ? (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-slate-900">Application overview</h2>
              <p className="text-sm text-slate-600">See the latest status of your applications at a glance.</p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-slate-300 text-slate-900 hover:bg-slate-100"
            >
              <Link href="/influencer/applications">My applications</Link>
            </Button>
          </div>

          {myApplicationsQuery.isLoading ? (
            <div className="space-y-4">
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : null}

          {myApplicationsQuery.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
              <p className="font-medium">Failed to load applications.</p>
              <p>{myApplicationsQuery.error?.message ?? 'Please try again.'}</p>
              <button
                type="button"
                onClick={() => myApplicationsQuery.refetch()}
                className="mt-3 inline-flex items-center rounded-full border border-rose-200 px-4 py-2 text-xs font-medium text-rose-600 transition hover:border-rose-400"
              >
                Retry
              </button>
            </div>
          ) : null}

          {!myApplicationsQuery.isLoading && !myApplicationsQuery.isError ? (
            <>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                  <p className="text-xs text-slate-200">Total applications</p>
                  <p className="mt-2 text-2xl font-semibold">{totalApplications.toLocaleString()}</p>
                </div>
                {statusOrder.map((status) => (
                  <div key={status} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="text-xs text-slate-500">{applicationStatusLabelMap[status]}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {applicationCounts[status].toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {latestApplications.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">Latest status updates</h3>

                  <ul className="space-y-2">
                    {latestApplications.map((application) => {
                      const statusDate = formatDate(application.statusUpdatedAt) ??
                        formatDate(application.appliedAt);

                      return (
                        <li
                          key={application.id}
                          className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-900">{application.campaignTitle}</span>
                            <span className="text-xs text-slate-500">
                              {statusDate ? `Updated on ${statusDate}` : 'No record'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <ApplicationStatusBadge status={application.status} />
                            <Link
                              href={`/campaigns/${application.campaignId}`}
                              className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
                            >
                              View details
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">You haven&apos;t applied to any campaigns yet.</p>
              )}
            </>
          ) : null}
        </section>
      ) : null}

      {canManageCampaigns ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">You&apos;re ready to manage campaigns.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Head to the campaign management page to review recruiting status and add new campaigns.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-100">
              <Link href="/advertiser/campaigns">Go to campaign management</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200">
        <Image
          alt="Dashboard illustration"
          src="https://picsum.photos/seed/dashboard/960/420"
          width={960}
          height={420}
          className="h-auto w-full object-cover"
          priority
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-medium text-slate-900">Service status</h2>
          <p className="mt-2 text-sm text-slate-600">
            Supabase and Hono APIs are operating normally. If you encounter issues, try resetting your session by signing out and back in from the header.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-medium text-slate-900">Application guide</h2>
          <p className="mt-2 text-sm text-slate-600">
            Check your application list by status and follow up quickly on the next step.
          </p>
        </article>
      </section>
    </div>
  );
}
