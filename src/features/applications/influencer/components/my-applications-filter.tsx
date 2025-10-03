"use client";

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  myApplicationStatusFilterValues,
  myApplicationStatusLabelMap,
  type MyApplicationStatusFilter,
} from '@/features/applications/lib/dto';

type MyApplicationsFilterProps = {
  value: MyApplicationStatusFilter;
  onChange: (nextValue: MyApplicationStatusFilter) => void;
};

const MyApplicationsFilterComponent = ({ value, onChange }: MyApplicationsFilterProps) => (
  <div className="flex flex-wrap gap-2">
    {myApplicationStatusFilterValues.map((item) => (
      <Button
        key={item}
        type="button"
        variant={value === item ? 'default' : 'outline'}
        onClick={() => onChange(item)}
        className="rounded-full px-4 py-2 text-sm"
      >
        {myApplicationStatusLabelMap[item]}
      </Button>
    ))}
  </div>
);

export const MyApplicationsFilter = memo(MyApplicationsFilterComponent);
