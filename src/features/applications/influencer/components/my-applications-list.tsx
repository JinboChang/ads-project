"use client";

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ApplicationStatusBadge } from '@/features/applications/influencer/components/application-status-badge';
import { type MyApplicationSummary } from '@/features/applications/lib/dto';

const formatDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return format(date, 'yyyy.MM.dd');
};

type MyApplicationsListProps = {
  items: MyApplicationSummary[];
};

export const MyApplicationsList = ({ items }: MyApplicationsListProps) => {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-base font-medium text-slate-700">아직 지원한 체험단이 없습니다.</p>
        <p className="text-sm text-slate-500">관심 있는 체험단을 찾아 먼저 지원해 보세요.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          체험단 찾아보기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const appliedAt = formatDate(item.appliedAt);
        const statusUpdatedAt = formatDate(item.statusUpdatedAt);
        const plannedVisitOn = formatDate(item.plannedVisitOn);
        const deadline = formatDate(item.campaignApplicationEndAt);
        const note = item.latestNote;
        const imageSrc = `https://picsum.photos/seed/application-${item.campaignId}/400/300`;
        const detailHref = `/campaigns/${item.campaignId}`;

        return (
          <article
            key={item.id}
            className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start"
          >
            <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-slate-100 md:h-32 md:w-48">
              <Image
                src={imageSrc}
                alt={item.campaignTitle}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 12rem, 100vw"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <ApplicationStatusBadge status={item.status} />
                  {deadline ? (
                    <span className="text-xs text-slate-500">모집 마감 {deadline}</span>
                  ) : null}
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{item.campaignTitle}</h2>
                {item.benefitSummary ? (
                  <p className="text-sm text-slate-600">{item.benefitSummary}</p>
                ) : null}
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-xs text-slate-500">지원 날짜</dt>
                  <dd className="font-medium text-slate-800">{appliedAt ?? '기록 없음'}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-xs text-slate-500">상태 변경</dt>
                  <dd className="font-medium text-slate-800">{statusUpdatedAt ?? '기록 없음'}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-xs text-slate-500">방문 예정일</dt>
                  <dd className="font-medium text-slate-800">{plannedVisitOn ?? '미정'}</dd>
                </div>
              </dl>
              {note ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">운영 메모: </span>
                  {note}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={detailHref}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400"
                >
                  체험단 상세 보기
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
