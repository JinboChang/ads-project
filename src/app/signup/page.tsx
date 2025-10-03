"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignupForm } from "@/features/onboarding/components/signup-form";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export type SignupPageParams = Promise<Record<string, never>>;

type SignupPageProps = {
  params: SignupPageParams;
};

const SignupPage = ({ params }: SignupPageProps) => {
  void params;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

  if (isAuthenticated) {
    return null;
  }

  return <SignupForm />;
};

export default SignupPage;
