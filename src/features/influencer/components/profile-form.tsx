"use client";

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  channelPlatformValues,
  influencerVerificationStatusValues,
  InfluencerChannelInputSchema,
  InfluencerProfileInputSchema,
  uploadFrequencyValues,
} from '@/features/influencer/lib/dto';
import { useInfluencerProfileQuery } from '@/features/influencer/hooks/useInfluencerProfileQuery';
import { useUpsertInfluencerProfile } from '@/features/influencer/hooks/useUpsertInfluencerProfile';

const FormChannelSchema = InfluencerChannelInputSchema.extend({
  verificationStatus: z
    .enum(influencerVerificationStatusValues)
    .optional(),
});

const profileFormSchema = InfluencerProfileInputSchema.extend({
  channels: z
    .array(FormChannelSchema)
    .min(1, '최소 1개의 채널은 등록해야 합니다.'),
});

export type InfluencerProfileFormValues = z.infer<typeof profileFormSchema>;

const channelDefault = (): InfluencerProfileFormValues['channels'][number] => ({
  platform: channelPlatformValues[0],
  channelName: '',
  channelUrl: '',
  audienceSize: undefined,
  uploadFrequency: uploadFrequencyValues[1],
  verificationStatus: 'pending',
});

const defaultValues: InfluencerProfileFormValues = {
  birthDate: '',
  channels: [channelDefault()],
};

const uploadFrequencyLabels: Record<typeof uploadFrequencyValues[number], string> = {
  daily: '하루에 여러 번',
  weekly: '주 1회 이상',
  biweekly: '격주 1회 이상',
  monthly: '월 1회 이상',
  occasionally: '필요할 때 가끔',
};

const verificationStatusLabel: Record<string, string> = {
  pending: '검토 중',
  approved: '승인 완료',
  rejected: '반려',
};

const verificationBadgeClass: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const resolveFieldError = (error: unknown): string | undefined => {
  if (!error) {
    return undefined;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return undefined;
};

const FieldError = ({ error }: { error: unknown }) => {
  const message = resolveFieldError(error);
  return message ? <span className="text-xs text-rose-500">{message}</span> : null;
};

export const InfluencerProfileForm = () => {
  const { toast } = useToast();
  const profileQuery = useInfluencerProfileQuery();
  const upsertMutation = useUpsertInfluencerProfile();

  const form = useForm<InfluencerProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'channels',
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        birthDate: profileQuery.data.birthDate ?? '',
        channels:
          profileQuery.data.channels.length > 0
            ? profileQuery.data.channels.map((channel) => ({
                platform: channel.platform,
                channelName: channel.channelName,
                channelUrl: channel.channelUrl,
                audienceSize: channel.audienceSize ?? undefined,
                uploadFrequency: channel.uploadFrequency,
                verificationStatus: channel.verificationStatus,
              }))
            : [channelDefault()],
      });
    }
  }, [form, profileQuery.data]);

  const handleAddChannel = useCallback(() => {
    append(channelDefault());
  }, [append]);

  const handleSubmit = useCallback(
    async (values: InfluencerProfileFormValues) => {
      try {
        await upsertMutation.mutateAsync({
          birthDate: values.birthDate,
          channels: values.channels.map(({ verificationStatus, ...channel }) => ({
            ...channel,
            audienceSize:
              typeof channel.audienceSize === 'number'
                ? channel.audienceSize
                : undefined,
          })),
        });

        toast({
          title: '채널 정보를 저장했습니다.',
          description: '검증이 완료되면 알림으로 알려드릴게요.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '채널 정보를 저장하는 중 문제가 발생했습니다.';
        toast({
          title: '채널 정보를 저장하지 못했습니다.',
          description: message,
          variant: 'destructive',
        });
      }
    },
    [toast, upsertMutation],
  );

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">채널 정보 등록</h1>
          <p className="text-sm text-slate-600">
            생년월일과 운영 중인 채널을 입력하면 온보딩이 완료되고 캠페인 지원이 가능해집니다.
          </p>
          {profileQuery.data?.onboardingStatus === 'completed' ? (
            <p className="text-xs font-medium text-emerald-600">온보딩이 완료된 상태입니다. 정보를 수정하시면 다시 검토가 진행됩니다.</p>
          ) : (
            <p className="text-xs font-medium text-amber-600">채널 검증이 완료될 때까지 체험단 지원 버튼이 비활성화됩니다.</p>
          )}
        </section>

        <section className="space-y-3">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            생년월일
            <input
              type="date"
              className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              disabled={upsertMutation.isPending}
              {...form.register('birthDate')}
            />
            <FieldError error={form.formState.errors.birthDate} />
          </label>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">채널 목록</h2>
            <button
              type="button"
              onClick={handleAddChannel}
              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              disabled={upsertMutation.isPending}
            >
              채널 추가
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const fieldErrors = form.formState.errors.channels?.[index];

              return (
                <div key={field.id} className="rounded-lg border border-slate-200 p-4 shadow-inner">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-700">채널 {index + 1}</span>
                      <span
                        className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium ${verificationBadgeClass[form.watch(`channels.${index}.verificationStatus`) ?? 'pending']}`}
                      >
                        {verificationStatusLabel[
                          form.watch(`channels.${index}.verificationStatus`) ?? 'pending'
                        ]}
                      </span>
                    </div>
                    {fields.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-600 transition hover:bg-rose-100"
                        disabled={upsertMutation.isPending}
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      플랫폼
                      <select
                        {...form.register(`channels.${index}.platform`)}
                        className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                        disabled={upsertMutation.isPending}
                      >
                        {channelPlatformValues.map((platform) => (
                          <option key={platform} value={platform}>
                            {platform.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <FieldError error={fieldErrors?.platform} />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      업로드 빈도
                      <select
                        {...form.register(`channels.${index}.uploadFrequency`)}
                        className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                        disabled={upsertMutation.isPending}
                      >
                        {uploadFrequencyValues.map((value) => (
                          <option key={value} value={value}>
                            {uploadFrequencyLabels[value]}
                          </option>
                        ))}
                      </select>
                      <FieldError error={fieldErrors?.uploadFrequency} />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      채널 이름
                      <input
                        type="text"
                        {...form.register(`channels.${index}.channelName`)}
                        className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                        disabled={upsertMutation.isPending}
                      />
                      <FieldError error={fieldErrors?.channelName} />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      채널 URL
                      <input
                        type="url"
                        placeholder="https://"
                        {...form.register(`channels.${index}.channelUrl`)}
                        className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                        disabled={upsertMutation.isPending}
                      />
                      <FieldError error={fieldErrors?.channelUrl} />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      구독/팔로워 수 (선택)
                      <input
                        type="number"
                        min={1}
                        {...form.register(`channels.${index}.audienceSize`, {
                          valueAsNumber: false,
                        })}
                        className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                        placeholder="예) 12000"
                        disabled={upsertMutation.isPending}
                      />
                      <FieldError error={fieldErrors?.audienceSize} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {profileQuery.isError ? (
          <p className="text-sm text-rose-600">
            {profileQuery.error instanceof Error
              ? profileQuery.error.message
              : '채널 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'}
          </p>
        ) : null}

        <footer className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={upsertMutation.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {upsertMutation.isPending ? '저장 중...' : '채널 정보 저장'}
          </button>
        </footer>
      </form>

      <aside className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-sm font-semibold text-slate-700">안내</h2>
        <p className="text-sm text-slate-600">
          채널 정보는 검증 팀이 확인한 뒤 승인되며, 승인 완료 시 체험단 지원이 활성화됩니다. 변경 사항이 있을
          경우 언제든지 업데이트해주세요.
        </p>
        <figure className="overflow-hidden rounded-lg border border-slate-200">
          <Image
            src="https://picsum.photos/seed/influencer-profile/640/640"
            alt="채널 정보 등록 안내 이미지"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </aside>
    </div>
  );
};



