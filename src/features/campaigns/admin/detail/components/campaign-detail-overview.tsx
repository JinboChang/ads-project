"use client";

import { format } from "date-fns";
import Image from "next/image";
import {
  type AdvertiserCampaignSummary,
  campaignStatusLabelMap,
} from "@/features/campaigns/lib/dto";
import { Button } from "@/components/ui/button";

type CampaignDetailOverviewProps = {
  campaign: AdvertiserCampaignSummary;
  onCloseCampaign?: () => void;
  onReopenCampaign?: () => void;
  isCloseDisabled?: boolean;
  isReopenDisabled?: boolean;
};

const getRemainingSlots = (campaign: AdvertiserCampaignSummary) =>
  Math.max(campaign.maxParticipants - campaign.stats.approvedCount, 0);

const formatDate = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return format(parsed, "yyyy.MM.dd");
};

export const CampaignDetailOverview = ({
  campaign,
  onCloseCampaign,
  onReopenCampaign,
  isCloseDisabled = false,
  isReopenDisabled = false,
}: CampaignDetailOverviewProps) => {
  const remainingSlots = getRemainingSlots(campaign);
  const imageSrc = `https://picsum.photos/seed/advertiser-campaign-detail-${campaign.id}/1200/480`;

  const renderActionButton = () => {
    if (campaign.status === "recruiting") {
      return (
        <Button
          type="button"
          className="rounded-full bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-500"
          onClick={onCloseCampaign}
          disabled={isCloseDisabled}
        >
          모집 종료하기
        </Button>
      );
    }

    if (campaign.status === "recruitment_closed") {
      return (
        <Button
          type="button"
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          onClick={onReopenCampaign}
          disabled={isReopenDisabled}
        >
          모집 다시 시작
        </Button>
      );
    }

    return null;
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-52 w-full bg-slate-100 md:h-64">
        <Image
          src={imageSrc}
          alt={campaign.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1 text-xs font-medium text-white">
              {campaignStatusLabelMap[campaign.status]}
            </span>
            <h1 className="text-3xl font-semibold text-slate-900">{campaign.title}</h1>
            {campaign.benefitSummary ? (
              <p className="text-sm text-slate-600">{campaign.benefitSummary}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-sm text-slate-500">
              모집 기간 {formatDate(campaign.applicationStartAt)} ~ {formatDate(campaign.applicationEndAt)}
            </div>
            {renderActionButton()}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-xs text-slate-500">총 지원자</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {campaign.stats.totalApplicants.toLocaleString()}명
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-xs text-slate-500">선정 완료</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {campaign.stats.approvedCount.toLocaleString()}명
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-xs text-slate-500">남은 선정 인원</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {remainingSlots.toLocaleString()}명
            </p>
          </div>
        </div>
        {campaign.missionDetails ? (
          <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
            <h2 className="text-sm font-semibold text-slate-900">미션 상세</h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-600">{campaign.missionDetails}</p>
          </div>
        ) : null}
        {campaign.storeLocation ? (
          <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
            <h2 className="text-sm font-semibold text-slate-900">매장 위치</h2>
            <p className="mt-2 text-slate-600">{campaign.storeLocation}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
};
