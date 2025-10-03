"use client";

import { useCallback, useEffect } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CampaignApplicationForm } from '@/features/applications/submit/components/campaign-application-form';
import { CampaignDetailContent } from '@/features/campaigns/detail/components/campaign-detail-content';
import { useCampaignDetailQuery } from '@/features/campaigns/detail/hooks/useCampaignDetailQuery';

export type CampaignDetailPageParams = Promise<{ id: string }>;

type CampaignDetailPageProps = {
  params: CampaignDetailPageParams;
};

const CampaignDetailPage = ({ params }: CampaignDetailPageProps) => {
  void params;

  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const campaignIdRaw = Number(routeParams?.id ?? '');
  const isValidId = Number.isFinite(campaignIdRaw) && campaignIdRaw > 0;
  const campaignId = isValidId ? campaignIdRaw : null;
  const isApplicationSheetOpen = searchParams.get('apply') === '1';

  const createUrlFromParams = useCallback(
    (nextParams: URLSearchParams) => {
      const query = nextParams.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname],
  );

  const openApplicationSheet = useCallback(() => {
    if (isApplicationSheetOpen) {
      return;
    }

    const nextParams = new URLSearchParams(searchParamsString);
    nextParams.set('apply', '1');
    router.replace(createUrlFromParams(nextParams), { scroll: false });
  }, [createUrlFromParams, isApplicationSheetOpen, router, searchParamsString]);

  const closeApplicationSheet = useCallback(() => {
    if (!isApplicationSheetOpen) {
      return;
    }

    const nextParams = new URLSearchParams(searchParamsString);
    nextParams.delete('apply');
    router.replace(createUrlFromParams(nextParams), { scroll: false });
  }, [createUrlFromParams, isApplicationSheetOpen, router, searchParamsString]);

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        openApplicationSheet();
        return;
      }

      closeApplicationSheet();
    },
    [closeApplicationSheet, openApplicationSheet],
  );

  useEffect(() => {
    if (!isValidId) {
      router.replace('/');
    }
  }, [isValidId, router]);

  const { data, isLoading, isError, error } = useCampaignDetailQuery(campaignId);

  if (!isValidId) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">체험단 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-600">
          {error instanceof Error ? error.message : '체험단 정보를 불러오지 못했습니다.'}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <CampaignDetailContent detail={data} />
      </div>
      <Sheet open={isApplicationSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="w-full max-w-xl border-slate-200 bg-slate-50 p-6"
        >
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-xl font-semibold text-slate-900">
              체험단 지원하기
            </SheetTitle>
            <p className="text-sm text-slate-600">{data.campaign.title}</p>
          </SheetHeader>
          <CampaignApplicationForm
            campaignId={data.campaign.id}
            onSuccess={closeApplicationSheet}
            onCancel={closeApplicationSheet}
          />
        </SheetContent>
      </Sheet>
    </main>
  );
};

export default CampaignDetailPage;
