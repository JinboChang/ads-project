"use client";

import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AdvertiserCampaignCreateInputSchema,
  type AdvertiserCampaignCreateInput,
} from '@/features/campaigns/lib/dto';
import { useCreateCampaignMutation } from '@/features/campaigns/admin/hooks/useCreateCampaignMutation';

const formSchema = z.object({
  title: z.string().min(1, '체험단 이름을 입력해주세요.'),
  benefitSummary: z.string().min(1, '혜택 요약을 입력해주세요.'),
  missionDetails: z.string().min(1, '미션 내용을 입력해주세요.'),
  storeLocation: z.string().optional(),
  applicationStartAt: z.string().min(1, '모집 시작일을 선택해주세요.'),
  applicationEndAt: z.string().min(1, '모집 종료일을 선택해주세요.'),
  maxParticipants: z
    .string()
    .min(1, '모집 인원을 입력해주세요.')
    .regex(/^[0-9]+$/, '숫자만 입력할 수 있습니다.'),
});

type CampaignCreateFormValues = z.infer<typeof formSchema>;

type CampaignCreateDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated?: (campaign: AdvertiserCampaignCreateInput) => void;
};

const toIsoDateString = (value: string) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
};

export const CampaignCreateDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CampaignCreateDialogProps) => {
  const form = useForm<CampaignCreateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      benefitSummary: '',
      missionDetails: '',
      storeLocation: '',
      applicationStartAt: '',
      applicationEndAt: '',
      maxParticipants: '',
    },
  });

  const { toast } = useToast();
  const createMutation = useCreateCampaignMutation();

  const isSubmitting = createMutation.isPending;

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: AdvertiserCampaignCreateInput = {
      title: values.title.trim(),
      benefitSummary: values.benefitSummary.trim(),
      missionDetails: values.missionDetails.trim(),
      storeLocation: values.storeLocation?.trim() || null,
      applicationStartAt: toIsoDateString(values.applicationStartAt),
      applicationEndAt: toIsoDateString(values.applicationEndAt),
      maxParticipants: Number.parseInt(values.maxParticipants, 10),
    };

    const parsed = AdvertiserCampaignCreateInputSchema.safeParse(payload);

    if (!parsed.success) {
      toast({
        title: '입력값을 확인해주세요.',
        description: '모집 정보가 올바른지 다시 한번 확인해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      toast({
        title: '체험단을 등록했어요.',
        description: '등록한 체험단은 목록에서 바로 확인할 수 있어요.',
      });
      form.reset();
      onOpenChange(false);
      onCreated?.(parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '체험단을 등록하지 못했습니다.';
      toast({
        title: '체험단 등록에 실패했습니다.',
        description: message,
        variant: 'destructive',
      });
    }
  });

  const submitButtonLabel = useMemo(
    () => (isSubmitting ? '등록 중...' : '체험단 등록'),
    [isSubmitting],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto border-slate-200 bg-slate-50 p-6">
        <SheetHeader className="space-y-2 text-left">
          <SheetTitle className="text-xl font-semibold text-slate-900">신규 체험단 등록</SheetTitle>
          <SheetDescription className="text-sm text-slate-600">
            모집 정보를 입력하면 즉시 목록에 반영됩니다.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>체험단 이름</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 가을 신메뉴 오프라인 체험단"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="benefitSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>혜택 요약</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 3만원 상당 메뉴 제공"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="missionDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>미션 상세 내용</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="방문 인증 + 인스타그램 후기 1회 업로드"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>매장 위치 (선택)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 서울시 강남구 테헤란로 123"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applicationStartAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모집 시작일</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicationEndAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모집 종료일</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모집 인원</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-700">
                {submitButtonLabel}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
