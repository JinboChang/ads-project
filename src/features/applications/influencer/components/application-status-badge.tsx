"use client";

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { type ApplicationStatus } from '@/features/campaigns/lib/dto';
import { applicationStatusLabelMap } from '@/features/applications/lib/dto';

const statusStyleMap: Record<ApplicationStatus, string> = {
  submitted: 'bg-slate-900 text-white',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-200 text-slate-600',
};

type ApplicationStatusBadgeProps = {
  status: ApplicationStatus;
};

const ApplicationStatusBadgeComponent = ({ status }: ApplicationStatusBadgeProps) => {
  const className = statusStyleMap[status] + ' border-transparent px-3 py-1 text-xs font-semibold';
  return <Badge className={className}>{applicationStatusLabelMap[status]}</Badge>;
};

export const ApplicationStatusBadge = memo(ApplicationStatusBadgeComponent);
