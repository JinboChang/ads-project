"use client";

import { useCallback } from 'react';
import { campaignSortValues, campaignStatusValues } from '@/features/campaigns/lib/dto';
import { useCampaignFilterStore } from '@/features/campaigns/browse/hooks/useCampaignFilters';

const statusLabels: Record<string, string> = {
  all: '전체',
  draft: '초안',
  recruiting: '모집중',
  recruitment_closed: '모집 종료',
  completed: '완료',
};

const sortLabels: Record<string, string> = {
  recent: '최신순',
  endingSoon: '마감 임박순',
};

export const CampaignFilterBar = () => {
  const {
    status,
    sort,
    location,
    setStatus,
    setSort,
    setLocation,
    reset,
  } = useCampaignFilterStore((state) => ({
    status: state.status,
    sort: state.sort,
    location: state.location,
    setStatus: state.setStatus,
    setSort: state.setSort,
    setLocation: state.setLocation,
    reset: state.reset,
  }));

  const handleStatusChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = event.target.value as typeof status;
      setStatus(next);
    },
    [setStatus],
  );

  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = event.target.value as typeof sort;
      setSort(next);
    },
    [setSort],
  );

  const handleLocationChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLocation(event.target.value);
    },
    [setLocation],
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-slate-800">체험단 탐색</h2>
        <button
          type="button"
          onClick={reset}
          className="self-start rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 md:self-auto"
        >
          필터 초기화
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          상태
          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          >
            <option value="all">{statusLabels.all}</option>
            {campaignStatusValues
              .filter((value) => value !== 'draft')
              .map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          정렬
          <select
            value={sort}
            onChange={handleSortChange}
            className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          >
            {campaignSortValues.map((value) => (
              <option key={value} value={value}>
                {sortLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          지역
          <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            placeholder="예: 서울"
            className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
};
