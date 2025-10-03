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
          승인됨
        </span>
      );
    case 'rejected':
      return (
        <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700">
          반려됨
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
          정보 입력 필요
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
        title: '저장되었습니다.',
        description: '광고주 정보가 업데이트되었고 체험단 모집 기능을 바로 사용할 수 있어요.',
      });
    },
    [mutateAsync, toast],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">광고주 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-rose-500">
          {error instanceof Error
            ? error.message
            : '광고주 정보를 불러오지 못했습니다.'}
        </p>
      </div>
    );
  }

  const currentStatus = data?.verificationStatus ?? advertiserVerificationStatusValues[0];
  const verificationNotes = data?.verificationNotes ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">광고주 정보 등록</h1>
        <p className="text-sm text-slate-500">
          사업자 정보를 등록하고 검증을 완료하면 체험단 모집 기능을 사용할 수 있어요.
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <section className="flex flex-col gap-3 rounded-md border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">검증 상태</h2>
              {statusBadge(currentStatus)}
            </div>
            <p className="text-xs text-slate-600">
              정보를 저장하면 바로 체험단 모집을 시작할 수 있고, 운영팀이 사후 검토를 진행할 수 있습니다.
            </p>
            {verificationNotes ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {verificationNotes}
              </p>
            ) : null}
          </section>

          <label className="flex flex-col gap-2 text-sm text-slate-700">
            업체명
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
            위치
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
            카테고리
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
            사업자등록번호
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              {...form.register('businessRegistrationNumber')}
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={isPending}
            />
            <span className="text-xs text-slate-500">
              하이픈 없이 10자리 숫자로 입력해주세요.
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
              {isPending ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
        <aside className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold text-slate-700">안내</h2>
          <p className="text-sm text-slate-600">
            입력하신 사업자 정보는 저장 직후 체험단 운영 권한에 반영되며, 필요 시 운영팀이 사후 검토를 진행합니다.
            정보 변경 시 다시 검토 단계로 전환될 수 있습니다.
          </p>
          <figure className="overflow-hidden rounded-lg border border-slate-200">
            <Image
              src="https://picsum.photos/seed/advertiser-profile/640/640"
              alt="광고주 프로필 안내 이미지"
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
