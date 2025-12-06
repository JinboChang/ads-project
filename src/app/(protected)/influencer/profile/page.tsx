"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InfluencerProfileForm } from '@/features/influencer/components/profile-form';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export type InfluencerProfilePageParams = Promise<Record<string, never>>;

type InfluencerProfilePageProps = {
  params: InfluencerProfilePageParams;
};

const getRoleType = (userMetadata?: Record<string, unknown>) => {
  const value = userMetadata?.roleType ?? userMetadata?.role_type;
  return typeof value === 'string' ? value : undefined;
};

const InfluencerProfilePage = ({ params }: InfluencerProfilePageProps) => {
  void params;

  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const roleType = getRoleType(user?.userMetadata);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login?redirectedFrom=/influencer/profile');
      return;
    }

    if (roleType !== 'influencer') {
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

  if (roleType !== 'influencer') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">This page is for influencers only.</p>
      </div>
    );
  }

  return <InfluencerProfileForm />;
};

export default InfluencerProfilePage;



