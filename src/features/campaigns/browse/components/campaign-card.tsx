"use client";

import { differenceInDays, format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import type { CampaignSummary } from '@/features/campaigns/lib/dto';

const statusBadgeClass: Record<string, string> = {
  recruiting: 'bg-emerald-100 text-emerald-700',
  recruitment_closed: 'bg-amber-100 text-amber-700',
  completed: 'bg-slate-200 text-slate-700',
  draft: 'bg-slate-200 text-slate-700',
};

const statusLabel: Record<string, string> = {
  recruiting: '모집중',
  recruitment_closed: '모집 종료',
  completed: '완료',
  draft: '초안',
};

type CampaignCardProps = {
  campaign: CampaignSummary;
};

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const endDate = campaign.applicationEndAt
    ? new Date(campaign.applicationEndAt)
    : null;
  const today = new Date();
  const daysLeft = endDate ? differenceInDays(endDate, today) : null;
  const badgeClass = statusBadgeClass[campaign.status] ?? 'bg-slate-200 text-slate-700';
  const badgeLabel = statusLabel[campaign.status] ?? campaign.status;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <figure className="relative h-40 w-full overflow-hidden bg-slate-100">
        <Image
          src={`https://picsum.photos/seed/campaign-${campaign.id}/640/480`}
          alt={campaign.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
      </figure>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">
            {campaign.title}
          </h3>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
        <p className="line-clamp-3 text-sm text-slate-600">
          {campaign.benefitSummary}
        </p>
        <div className="mt-auto space-y-2 text-sm text-slate-500">
          {campaign.storeLocation ? (
            <p>위치: {campaign.storeLocation}</p>
          ) : null}
          {endDate ? (
            <p>
              모집 마감: {format(endDate, 'yyyy.MM.dd')}{' '}
              {daysLeft !== null && daysLeft >= 0 ? (
                <span className="text-xs text-rose-600">(D-{daysLeft})</span>
              ) : (
                <span className="text-xs text-slate-400">(마감)</span>
              )}
            </p>
          ) : (
            <p>모집 마감: 상시 모집</p>
          )}
        </div>
        <Link
          href={`/campaigns/${campaign.id}`}
          className="mt-3 inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          자세히 보기
        </Link>
      </div>
    </div>
  );
};
