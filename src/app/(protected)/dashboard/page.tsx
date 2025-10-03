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
        <h1 className="text-3xl font-semibold text-slate-900">대시보드</h1>
        <p className="text-sm text-slate-500">
          {user?.email ? `${user.email} 님 환영합니다.` : "계정을 불러오는 중입니다."}
        </p>
      </header>

      {shouldCompleteInfluencerOnboarding ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-medium text-amber-900">채널 정보를 등록하면 온보딩이 완료됩니다.</h2>
          <p className="mt-2 text-sm text-amber-800">
            채널 정보만 입력하면 바로 체험단 지원을 시작할 수 있어요. 지금 등록해 보세요.
          </p>
          <div className="mt-4">
            <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
              <Link href="/influencer/profile">채널 정보 등록하기</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {shouldCompleteAdvertiserOnboarding ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-medium text-emerald-900">사업자 정보를 등록하고 체험단 모집을 시작해 보세요.</h2>
          <p className="mt-2 text-sm text-emerald-800">
            업체 정보를 저장하면 즉시 체험단 모집 기능을 사용할 수 있습니다. 운영팀이 사후 검토를 진행할 수 있으니 정확히 입력해주세요.
          </p>
          <div className="mt-4">
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Link href="/advertiser/profile">사업자 정보 등록하기</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {isInfluencer ? (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-slate-900">체험단 지원 현황</h2>
              <p className="text-sm text-slate-600">최근 지원 상태를 한눈에 확인해 보세요.</p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-slate-300 text-slate-900 hover:bg-slate-100"
            >
              <Link href="/influencer/applications">내 지원 목록</Link>
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
              <p className="font-medium">지원 현황을 불러오지 못했습니다.</p>
              <p>{myApplicationsQuery.error?.message ?? '다시 시도해 주세요.'}</p>
              <button
                type="button"
                onClick={() => myApplicationsQuery.refetch()}
                className="mt-3 inline-flex items-center rounded-full border border-rose-200 px-4 py-2 text-xs font-medium text-rose-600 transition hover:border-rose-400"
              >
                다시 시도
              </button>
            </div>
          ) : null}

          {!myApplicationsQuery.isLoading && !myApplicationsQuery.isError ? (
            <>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                  <p className="text-xs text-slate-200">총 지원</p>
                  <p className="mt-2 text-2xl font-semibold">{totalApplications.toLocaleString()}건</p>
                </div>
                {statusOrder.map((status) => (
                  <div key={status} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="text-xs text-slate-500">{applicationStatusLabelMap[status]}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {applicationCounts[status].toLocaleString()}건
                    </p>
                  </div>
                ))}
              </div>

              {latestApplications.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">최근 상태 업데이트</h3>
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
                              {statusDate ? `${statusDate} 업데이트` : '기록 없음'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <ApplicationStatusBadge status={application.status} />
                            <Link
                              href={`/campaigns/${application.campaignId}`}
                              className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
                            >
                              상세 보기
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">아직 지원한 체험단이 없습니다.</p>
              )}
            </>
          ) : null}
        </section>
      ) : null}

      {canManageCampaigns ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">체험단을 운영할 준비가 되었어요.</h2>
          <p className="mt-2 text-sm text-slate-600">
            체험단 관리 페이지에서 모집 현황을 확인하고 신규 체험단을 등록해 보세요.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-100">
              <Link href="/advertiser/campaigns">체험단 관리로 이동</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200">
        <Image
          alt="대시보드 안내 이미지"
          src="https://picsum.photos/seed/dashboard/960/420"
          width={960}
          height={420}
          className="h-auto w-full object-cover"
          priority
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-medium text-slate-900">서비스 상태</h2>
          <p className="mt-2 text-sm text-slate-600">
            Supabase와 Hono API는 정상 동작 중입니다. 문제 발생 시 헤더의 로그아웃/로그인으로 세션을 초기화해 주세요.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-medium text-slate-900">체험단 지원 현황 가이드</h2>
          <p className="mt-2 text-sm text-slate-600">
            내 지원 목록에서 상태별 진행 상황을 확인하고, 빠르게 다음 행동을 이어가 보세요.
          </p>
        </article>
      </section>
    </div>
  );
}
