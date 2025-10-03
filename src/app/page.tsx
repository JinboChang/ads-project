"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { CampaignFilterBar } from "@/features/campaigns/browse/components/campaign-filter-bar";
import { CampaignList } from "@/features/campaigns/browse/components/campaign-list";

export default function Home() {
  const { isAuthenticated } = useCurrentUser();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
          <h1 className="text-3xl font-semibold md:text-4xl">
            원하는 체험단을 지금 바로 만나보세요
          </h1>
          <p className="max-w-2xl text-sm text-slate-200 md:text-base">
            신뢰할 수 있는 체험단을 한 곳에서 탐색하고 신청 흐름까지 이어집니다.
            체험단을 등록하면 즉시 공개 일정과 함께 노출됩니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-6">
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="gap-2 bg-white text-slate-900 hover:bg-white/90"
              >
                <Link href="/dashboard">
                  내 대시보드로 이동
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="gap-2 bg-white text-slate-900 hover:bg-white/90"
                >
                  <Link href="/signup">
                    무료로 시작하기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-slate-200 bg-transparent text-white hover:bg-white hover:text-slate-900"
                >
                  <Link href="/login">로그인</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <CampaignFilterBar />
        <CampaignList />
      </section>
    </main>
  );
}
