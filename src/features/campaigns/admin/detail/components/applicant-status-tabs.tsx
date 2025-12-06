"use client";

import { Button } from "@/components/ui/button";
import {
  AdvertiserApplicantStatusFilter,
  advertiserApplicantStatusFilterValues,
  applicationStatusLabelMap,
} from "@/features/applications/lib/dto";
import { applicationStatusValues } from "@/features/campaigns/lib/dto";

const statusLabels: Record<AdvertiserApplicantStatusFilter, string> = {
  all: "All",
  submitted: applicationStatusLabelMap.submitted,
  approved: applicationStatusLabelMap.approved,
  rejected: applicationStatusLabelMap.rejected,
  cancelled: applicationStatusLabelMap.cancelled,
};

type ApplicantStatusTabsProps = {
  selected: AdvertiserApplicantStatusFilter;
  onSelect: (status: AdvertiserApplicantStatusFilter) => void;
  counts: Partial<Record<(typeof applicationStatusValues)[number], number>>;
};

export const ApplicantStatusTabs = ({
  selected,
  onSelect,
  counts,
}: ApplicantStatusTabsProps) => (
  <div className="flex flex-wrap gap-2">
    {advertiserApplicantStatusFilterValues.map((status) => {
      const isActive = status === selected;
      const count =
        status === "all"
          ? applicationStatusValues.reduce(
              (acc, key) => acc + (counts[key] ?? 0),
              0,
            )
          : counts[status] ?? 0;
      return (
        <Button
          key={status}
          variant={isActive ? "default" : "outline"}
          className="rounded-full px-4 py-2 text-sm"
          onClick={() => onSelect(status)}
          type="button"
        >
          {statusLabels[status]} ({count.toLocaleString()})
        </Button>
      );
    })}
  </div>
);
