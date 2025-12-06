"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  campaignEligibilityReasonValues,
  type CampaignDetailResponse,
} from '@/features/campaigns/lib/dto';
import { format } from 'date-fns';

const eligibilityMessage: Record<typeof campaignEligibilityReasonValues[number], string> = {
  eligible: 'You can apply.',
  unauthenticated: 'Sign in to apply.',
  not_influencer: 'Only influencers can apply.',
  profile_incomplete: 'Please complete your influencer profile first.',
  profile_not_verified: 'Your influencer profile needs verification.',
  already_applied: 'You have already applied to this campaign.',
  campaign_closed: 'This campaign is closed.',
  outside_period: 'Applications are not open right now.',
  quota_full: 'All slots are full.',
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
        Apply now
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
                {campaign.status === 'recruiting' ? 'Recruiting' : campaign.status === 'recruitment_closed' ? 'Recruitment Closed' : campaign.status === 'completed' ? 'Completed' : 'Draft'}
              </span>
              <h1 className="text-3xl font-semibold text-slate-900">{campaign.title}</h1>
              <p className="text-sm text-slate-600">{campaign.benefitSummary}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:w-72">
              <div className="flex items-center justify-between">
                <span>Capacity</span>
                <span className="font-medium text-slate-900">
                  {stats.remainingSlots.toLocaleString()} / {campaign.maxParticipants.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Applicants</span>
                <span>{stats.totalApplicants.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Selected</span>
                <span>{stats.approvedCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700">Application period</h2>
              <p className="text-sm text-slate-600">
                {startAt ?? 'TBD'} ~ {endAt ?? 'TBD'}
              </p>
              <p className="text-xs text-slate-500">
                Schedule may change based on recruiting status.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700">Application status</h2>
              <p className="text-sm text-slate-600">
                {hasApplied
                  ? `You already applied. (Current status: ${userApplicationStatus ?? ''})`
                  : message}
              </p>
              {renderAction()}
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700">Mission details</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {campaign.missionDetails}
            </p>
            {campaign.storeLocation ? (
              <p className="text-xs text-slate-500">Location: {campaign.storeLocation}</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};
