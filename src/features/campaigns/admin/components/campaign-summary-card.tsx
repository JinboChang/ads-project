"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import {
  AdvertiserCampaignSummary,
  campaignStatusLabelMap,
  type CampaignStatus,
} from "@/features/campaigns/lib/dto";

const statusStyleMap: Record<CampaignStatus, string> = {
  draft: "bg-slate-200 text-slate-600",
  recruiting: "bg-emerald-100 text-emerald-700",
  recruitment_closed: "bg-amber-100 text-amber-700",
  completed: "bg-slate-900 text-white",
};

const formatDate = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return format(parsed, "yyyy.MM.dd");
};

type CampaignSummaryCardProps = {
  campaign: AdvertiserCampaignSummary;
};

const statusCountLabelMap = {
  submitted: "지원",
  approved: "선정",
  rejected: "미선정",
  cancelled: "취소",
} as const;

export const CampaignSummaryCard = ({ campaign }: CampaignSummaryCardProps) => {
  const statusBadgeClassName = [
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
    statusStyleMap[campaign.status],
  ].join(" ");
  const imageSrc = `https://picsum.photos/seed/advertiser-campaign-${campaign.id}/480/320`;
  const detailHref = `/advertiser/campaigns/${campaign.id}`;
  const statusCounts: Array<{ key: keyof typeof statusCountLabelMap; value: number }> = [
    { key: "submitted", value: campaign.stats.submittedCount },
    { key: "approved", value: campaign.stats.approvedCount },
    { key: "rejected", value: campaign.stats.rejectedCount },
    { key: "cancelled", value: campaign.stats.cancelledCount },
  ];

  return (
    <article className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start">
      <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-slate-100 lg:h-36 lg:w-56">
        <Image
          src={imageSrc}
          alt={campaign.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 14rem, 100vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className={statusBadgeClassName}>{campaignStatusLabelMap[campaign.status]}</span>
            <span className="text-xs text-slate-500">
              모집 기간 {formatDate(campaign.applicationStartAt)} ~ {formatDate(campaign.applicationEndAt)}
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">{campaign.title}</h2>
          {campaign.benefitSummary ? (
            <p className="text-sm text-slate-600">{campaign.benefitSummary}</p>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">총 지원자</span>
              <span className="text-base font-semibold text-slate-900">
                {campaign.stats.totalApplicants.toLocaleString()}명
              </span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
              {statusCounts.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm"
                >
                  <span className="font-medium text-slate-700">{statusCountLabelMap[item.key]}</span>
                  <span>{item.value.toLocaleString()}명</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">모집 인원</dt>
                <dd className="font-medium text-slate-900">
                  {campaign.maxParticipants.toLocaleString()}명
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">최근 지원일</dt>
                <dd className="font-medium text-slate-900">
                  {campaign.stats.lastApplicationAt
                    ? formatDate(campaign.stats.lastApplicationAt)
                    : "기록 없음"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={detailHref}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400"
          >
            상세 보기
          </Link>
        </div>
      </div>
    </article>
  );
};
