"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useInfluencerProfileQuery } from "@/features/influencer/hooks/useInfluencerProfileQuery";

const LOGO_LABEL = "SuperNext";
const REDIRECT_AFTER_SIGNOUT = "/login";

export const AppHeader = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user, signOut } = useCurrentUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const roleType = (user?.userMetadata?.roleType ?? user?.userMetadata?.role_type) as
    | string
    | undefined;
  const isInfluencer = roleType === "influencer";

  const { data: influencerProfile, isLoading: isProfileLoading } =
    useInfluencerProfileQuery({
      enabled: isAuthenticated && isInfluencer,
    });

  const shouldShowOnboardingCta =
    isInfluencer &&
    !isProfileLoading &&
    (influencerProfile?.onboardingStatus ?? 'pending') === 'pending';

  const userEmail = useMemo(() => user?.email ?? "Signed in", [user?.email]);

  const handleLogout = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      toast({
        title: "Signed out.",
      });
      router.replace(REDIRECT_AFTER_SIGNOUT);
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Failed to sign out.",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, router, signOut, toast]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-base font-semibold text-slate-900">
          {LOGO_LABEL}
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline-flex">
              {userEmail}
            </span>
            {shouldShowOnboardingCta ? (
              <Button
                asChild
                className="bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                disabled={isSigningOut}
              >
                <Link href="/influencer/profile">Add channel info</Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={isLoading || isSigningOut}
              className="gap-1"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};




