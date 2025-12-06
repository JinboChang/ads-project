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
            Discover the right campaigns right now
          </h1>
          <p className="max-w-2xl text-sm text-slate-200 md:text-base">
            Explore trusted campaigns in one place and apply without friction.
            Publish your own campaign to share dates and details instantly.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-6">
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="gap-2 bg-white text-slate-900 hover:bg-white/90"
              >
                <Link href="/dashboard">
                  Go to my dashboard
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
                    Get started for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-slate-200 bg-transparent text-white hover:bg-white hover:text-slate-900"
                >
                  <Link href="/login">Sign in</Link>
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
