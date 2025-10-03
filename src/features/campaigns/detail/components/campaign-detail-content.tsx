"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  campaignEligibilityReasonValues,
  type CampaignDetailResponse,
} from '@/features/campaigns/lib/dto';
import { format } from 'date-fns';

const eligibilityMessage: Record<typeof campaignEligibilityReasonValues[number], string> = {
  eligible: '지원 가능합니다.',
  unauthenticated: '로그인 후 지원할 수 있습니다.',
  not_influencer: '인플루언서만 지원할 수 있습니다.',
  profile_incomplete: '인플루언서 프로필을 먼저 등록해주세요.',
  profile_not_verified: '인플루언서 프로필 검증이 필요합니다.',
  already_applied: '이미 지원한 체험단입니다.',
  campaign_closed: '모집이 종료된 체험단입니다.',
  outside_period: '모집 기간이 아닙니다.',
  quota_full: '모집 정원이 가득 찼습니다.',
};

type CampaignDetailContentProps = {
  detail: CampaignDetailResponse;
};

export const CampaignDetailContent = ({ detail }: CampaignDetailContentProps) => {
  const { campaign, stats, eligibility, userApplicationStatus } = detail;

  const startAt = campaign.applicationStartAt
    ? format(new Date(campaign.applicationStartAt), 'yyyy.MM.dd')
    : null;
  const endAt = campaign.applicationEndAt
    ? format(new Date(campaign.applicationEndAt), 'yyyy.MM.dd')
    : null;

  const message = eligibilityMessage[eligibility.reason];
  const hasApplied = Boolean(userApplicationStatus);

  const renderAction = () => {
    if (!eligibility.isEligible) {
      return (
        <button
          type="button"
          disabled
          className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-500"
        >
          {message}
        </button>
      );
    }

    return (
      <Link
        href={`/campaigns/${campaign.id}?apply=1`}
        className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        지원하기
      </Link>
    );
  };

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-60 w-full bg-slate-100">
          <Image
            src={`https://picsum.photos/seed/campaign-hero-${campaign.id}/1200/480`}
            alt={campaign.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="space-y-6 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {campaign.status === 'recruiting' ? '모집중' : campaign.status === 'recruitment_closed' ? '모집 종료' : campaign.status === 'completed' ? '완료' : '초안'}
              </span>
              <h1 className="text-3xl font-semibold text-slate-900">{campaign.title}</h1>
              <p className="text-sm text-slate-600">{campaign.benefitSummary}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:w-72">
              <div className="flex items-center justify-between">
                <span>모집 정원</span>
                <span className="font-medium text-slate-900">
                  {stats.remainingSlots.toLocaleString()} / {campaign.maxParticipants.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>신청 인원</span>
                <span>{stats.totalApplicants.toLocaleString()}명</span>
              </div>
              <div className="flex items-center justify-between">
                <span>선정 인원</span>
                <span>{stats.approvedCount.toLocaleString()}명</span>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700">모집 기간</h2>
              <p className="text-sm text-slate-600">
                {startAt ?? '미정'} ~ {endAt ?? '미정'}
              </p>
              <p className="text-xs text-slate-500">
                일정은 모집 상황에 따라 변경될 수 있습니다.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700">지원 상태</h2>
              <p className="text-sm text-slate-600">
                {hasApplied
                  ? `이미 지원한 체험단입니다. (현재 상태: ${userApplicationStatus ?? ''})`
                  : message}
              </p>
              {renderAction()}
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700">미션 안내</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {campaign.missionDetails}
            </p>
            {campaign.storeLocation ? (
              <p className="text-xs text-slate-500">모집 장소: {campaign.storeLocation}</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};
