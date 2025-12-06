"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdvertiserProfileForm } from '@/features/advertiser/components/profile-form';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export type AdvertiserProfilePageParams = Promise<Record<string, never>>;

type AdvertiserProfilePageProps = {
  params: AdvertiserProfilePageParams;
};

const getRoleType = (user?: {
  userMetadata?: Record<string, unknown>;
  appMetadata?: Record<string, unknown>;
}) => {
  const sources = [user?.userMetadata, user?.appMetadata];
  for (const source of sources) {
    const value = source?.roleType ?? source?.role_type;
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

const AdvertiserProfilePage = ({ params }: AdvertiserProfilePageProps) => {
  void params;

  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const roleType = getRoleType(user);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login?redirectedFrom=/advertiser/profile');
      return;
    }

    if (roleType !== 'advertiser') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, roleType, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">Checking your information...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">Please sign in to continue.</p>
      </div>
    );
  }

  if (roleType !== 'advertiser') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">This page is for advertisers only.</p>
      </div>
    );
  }

  return <AdvertiserProfileForm />;
};

export default AdvertiserProfilePage;
