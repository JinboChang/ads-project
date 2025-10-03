"use client";

import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  applicationStatusLabelMap,
  type AdvertiserApplicantSummary,
} from "@/features/applications/lib/dto";

const formatDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return format(parsed, "yyyy.MM.dd");
};

type ApplicantTableProps = {
  applicants: AdvertiserApplicantSummary[];
  selectedIds: Set<number>;
  onToggleApplicant: (applicantId: number) => void;
  onToggleAll: () => void;
  selectionEnabled: boolean;
  isApplicantSelectable?: (applicant: AdvertiserApplicantSummary) => boolean;
};

export const ApplicantTable = ({
  applicants,
  selectedIds,
  onToggleApplicant,
  onToggleAll,
  selectionEnabled,
  isApplicantSelectable,
}: ApplicantTableProps) => {
  const selectableList = isApplicantSelectable
    ? applicants.filter((item) => isApplicantSelectable(item))
    : applicants;
  const allSelected =
    selectableList.length > 0 && selectableList.every((item) => selectedIds.has(item.id));

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAll}
                disabled={!selectionEnabled || applicants.length === 0}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">지원자</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">채널</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">지원 일시</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">방문 예정일</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">상태</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">메모</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applicants.map((applicant) => {
            const submittedAt = formatDate(applicant.submittedAt);
            const plannedVisitOn = formatDate(applicant.plannedVisitOn);
            const statusLabel = applicationStatusLabelMap[applicant.status];
            const isSelected = selectedIds.has(applicant.id);
            const selectable = isApplicantSelectable
              ? isApplicantSelectable(applicant)
              : true;

            return (
              <tr key={applicant.id} className="text-sm text-slate-700">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleApplicant(applicant.id)}
                    disabled={!selectionEnabled || !selectable}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{applicant.influencerName}</span>
                    {applicant.influencerEmail ? (
                      <span className="text-xs text-slate-500">{applicant.influencerEmail}</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {applicant.channels.length === 0 ? (
                      <span className="text-xs text-slate-500">채널 정보 없음</span>
                    ) : (
                      applicant.channels.map((channel, index) => {
                        const labelParts = [channel.platform];
                        if (channel.channelName) {
                          labelParts.push(` · ${channel.channelName}`);
                        }
                        return (
                          <span
                            key={`${channel.platform}-${index}`}
                            className="text-xs text-slate-500"
                          >
                            {labelParts.join("")}
                            {channel.channelUrl ? (
                              <a
                                href={channel.channelUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2 text-emerald-600 underline"
                              >
                                바로가기
                              </a>
                            ) : null}
                          </span>
                        );
                      })
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{submittedAt ?? "-"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{plannedVisitOn ?? "미정"}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{statusLabel}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {applicant.latestNote ?? applicant.motivationNote ?? "메모 없음"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {applicants.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          표시할 지원자가 없습니다.
        </div>
      ) : null}
    </div>
  );
};
