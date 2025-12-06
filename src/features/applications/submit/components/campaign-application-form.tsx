"use client";

import { useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  CampaignApplicationPayloadSchema,
} from '@/features/applications/submit/backend/schema';
import { useSubmitApplicationMutation } from '@/features/applications/submit/hooks/useSubmitApplicationMutation';

const applicationFormSchema = CampaignApplicationPayloadSchema.omit({
  campaignId: true,
});

export type CampaignApplicationFormValues = z.infer<typeof applicationFormSchema>;

type CampaignApplicationFormProps = {
  campaignId: number;
  onSuccess: () => void;
  onCancel: () => void;
};

export const CampaignApplicationForm = ({
  campaignId,
  onSuccess,
  onCancel,
}: CampaignApplicationFormProps) => {
  const { toast } = useToast();
  const { mutateAsync, isPending } = useSubmitApplicationMutation();

  const form = useForm<CampaignApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      motivationNote: '',
      plannedVisitOn: '',
    },
  });

  const handleSubmit = useCallback(
    async (values: CampaignApplicationFormValues) => {
      await mutateAsync({
        campaignId,
        motivationNote: values.motivationNote,
        plannedVisitOn: values.plannedVisitOn,
      });

      toast({
        title: 'Application submitted.',
        description: 'You can view this request in My Applications.',
      });

      onSuccess();
      form.reset();
    },
    [campaignId, form, mutateAsync, onSuccess, toast],
  );

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Motivation
        <textarea
          rows={4}
          {...form.register('motivationNote')}
          className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          placeholder="e.g., I will diligently complete the campaign mission."
          disabled={isPending}
        />
        {form.formState.errors.motivationNote ? (
          <span className="text-xs text-rose-500">
            {form.formState.errors.motivationNote.message}
          </span>
        ) : null}
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Planned visit date
        <input
          type="date"
          {...form.register('plannedVisitOn')}
          className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          disabled={isPending}
        />
        {form.formState.errors.plannedVisitOn ? (
          <span className="text-xs text-rose-500">
            {form.formState.errors.plannedVisitOn.message}
          </span>
        ) : null}
      </label>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-400"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? 'Submitting...' : 'Submit application'}
        </button>
      </div>
    </form>
  );
};
