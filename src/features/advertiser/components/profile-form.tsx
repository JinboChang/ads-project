"use client";

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  AdvertiserProfileInputSchema,
  advertiserVerificationStatusValues,
} from '@/features/advertiser/lib/dto';
import { useAdvertiserProfileQuery } from '@/features/advertiser/hooks/useAdvertiserProfileQuery';
import { useUpsertAdvertiserProfile } from '@/features/advertiser/hooks/useUpsertAdvertiserProfile';

const profileFormSchema = AdvertiserProfileInputSchema;

export type AdvertiserProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: AdvertiserProfileFormValues = {
  companyName: '',
  location: '',
  businessCategory: '',
  businessRegistrationNumber: '',
};

const formatBusinessNumber = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 10);

const statusBadge = (status: string | null | undefined) => {
  switch (status) {
    case 'approved':
      return (
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
          Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700">
          Rejected
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
          Details required
        </span>
      );
  }
};

export const AdvertiserProfileForm = () => {
  const { toast } = useToast();
  const {
    data,
    isLoading,
    isError,
    error,
  } = useAdvertiserProfileQuery();
  const { mutateAsync, isPending } = useUpsertAdvertiserProfile();

  const form = useForm<AdvertiserProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  const watchedBusinessNumber = form.watch('businessRegistrationNumber');

  useEffect(() => {
    if (data) {
      form.reset({
        companyName: data.companyName ?? '',
        location: data.location ?? '',
        businessCategory: data.businessCategory ?? '',
        businessRegistrationNumber: data.businessRegistrationNumber ?? '',
      });
    }
  }, [data, form]);

  useEffect(() => {
    const normalized = formatBusinessNumber(watchedBusinessNumber ?? '');
    if (normalized !== (watchedBusinessNumber ?? '')) {
      form.setValue('businessRegistrationNumber', normalized, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [form, watchedBusinessNumber]);

  const handleSubmit = useCallback(
    async (values: AdvertiserProfileFormValues) => {
      await mutateAsync({
        companyName: values.companyName.trim(),
        location: values.location.trim(),
        businessCategory: values.businessCategory.trim(),
        businessRegistrationNumber: values.businessRegistrationNumber.trim(),
      });

      toast({
        title: 'Saved.',
        description: 'Advertiser information has been updated. You can start recruiting right away.',
      });
    },
    [mutateAsync, toast],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading advertiser information...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-rose-500">
          {error instanceof Error
            ? error.message
            : 'Failed to load advertiser information.'}
        </p>
      </div>
    );
  }

  const currentStatus = data?.verificationStatus ?? advertiserVerificationStatusValues[0];
  const verificationNotes = data?.verificationNotes ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Advertiser information</h1>
        <p className="text-sm text-slate-500">Add your business details and verification to start running campaigns.</p>
      </header>
      <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <section className="flex flex-col gap-3 rounded-md border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Verification status</h2>
              {statusBadge(currentStatus)}
            </div>
            <p className="text-xs text-slate-600">
              Once you save your info, you can immediately start recruiting and our team may review it afterward.
            </p>
            {verificationNotes ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {verificationNotes}
              </p>
            ) : null}
          </section>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Company name
            <input
              type="text"
              {...form.register('companyName')}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={isPending}
            />
            {form.formState.errors.companyName ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.companyName.message}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Location
            <input
              type="text"
              {...form.register('location')}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={isPending}
            />
            {form.formState.errors.location ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.location.message}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Category
            <input
              type="text"
              {...form.register('businessCategory')}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={isPending}
            />
            {form.formState.errors.businessCategory ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.businessCategory.message}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Business registration number
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              {...form.register('businessRegistrationNumber')}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={isPending}
            />
            <span className="text-xs text-slate-500">
              Enter 10 digits with no hyphens.
            </span>
            {form.formState.errors.businessRegistrationNumber ? (
              <span className="text-xs text-rose-500">
                {form.formState.errors.businessRegistrationNumber.message}
              </span>
            ) : null}
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
        <aside className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold text-slate-700">Notes</h2>
          <p className="text-sm text-slate-600">
            The business details you provide will unlock campaign management immediately. Our team may review the information afterward, and edits can trigger another review.
          </p>
          <figure className="overflow-hidden rounded-lg border border-slate-200">
            <Image
              src="https://picsum.photos/seed/advertiser-profile/640/640"
              alt="Advertiser profile helper image"
              width={640}
              height={640}
              className="h-full w-full object-cover"
              priority
            />
          </figure>
        </aside>
      </div>
    </div>
  );
};
