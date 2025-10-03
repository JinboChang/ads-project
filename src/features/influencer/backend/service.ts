import { differenceInYears, isAfter } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type SuccessResult } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  influencerErrorCodes,
  type InfluencerErrorCode,
} from '@/features/influencer/backend/error';
import type {
  InfluencerChannelInput,
  InfluencerProfilePayload,
  InfluencerProfileResponse,
  UploadFrequency,
} from '@/features/influencer/backend/schema';

const MINIMUM_AGE = 14;

const verificationStatusValues = ['pending', 'approved', 'rejected'] as const;

type VerificationStatus = (typeof verificationStatusValues)[number];

type ProfileRow = {
  birth_date: string | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
};

type BaseProfileRow = {
  onboarding_status: 'pending' | 'completed';
  role_type: 'influencer' | 'advertiser';
};

type ChannelRow = {
  id: number;
  platform: string;
  channel_name: string;
  channel_url: string;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  audience_size: number | null;
  upload_frequency: UploadFrequency;
};

type FailureResult = ReturnType<typeof failure<InfluencerErrorCode>>;

type NullableSuccess = SuccessResult<null>;

type NullableResult = FailureResult | NullableSuccess;

const calculateAge = (birthDate: string) => {
  const today = new Date();
  const parsed = new Date(birthDate);

  if (Number.isNaN(parsed.getTime()) || isAfter(parsed, today)) {
    return 0;
  }

  return differenceInYears(today, parsed);
};

const ensureAgeRequirement = (birthDate: string): FailureResult | null => {
  const age = calculateAge(birthDate);

  if (age < MINIMUM_AGE) {
    return failure(
      400,
      influencerErrorCodes.underAge,
      '만 14세 이상만 채널 정보를 등록할 수 있습니다.',
    );
  }

  return null;
};

const ensureChannelUniqueness = (
  channels: InfluencerChannelInput[],
): FailureResult | null => {
  const seen = new Set<string>();

  for (const channel of channels) {
    const key = `${channel.platform.toLowerCase()}|${channel.channelUrl.toLowerCase()}`;

    if (seen.has(key)) {
      return failure(
        400,
        influencerErrorCodes.channelDuplicate,
        '동일한 채널이 중복되어 있습니다. 채널 정보를 확인해주세요.',
      );
    }

    seen.add(key);
  }

  return null;
};

const mapProfile = (
  baseProfile: BaseProfileRow | null,
  profile: ProfileRow | null,
  channels: ChannelRow[],
): InfluencerProfileResponse => ({
  onboardingStatus: baseProfile?.onboarding_status ?? 'pending',
  birthDate: profile?.birth_date ?? null,
  verificationStatus: profile?.verification_status ?? 'pending',
  verificationNotes: profile?.verification_notes ?? null,
  channels: channels.map((channel) => ({
    id: channel.id,
    platform: channel.platform as InfluencerChannelInput['platform'],
    channelName: channel.channel_name,
    channelUrl: channel.channel_url,
    audienceSize: channel.audience_size,
    verificationStatus: channel.verification_status,
    lastVerifiedAt: channel.last_verified_at,
    uploadFrequency: channel.upload_frequency,
  })),
});

const fetchProfileRow = async (supabase: SupabaseClient, userId: string) =>
  supabase
    .from('influencer_profiles')
    .select('birth_date, verification_status, verification_notes')
    .eq('influencer_id', userId)
    .maybeSingle<ProfileRow>();

const fetchBaseProfileRow = async (supabase: SupabaseClient, userId: string) =>
  supabase
    .from('profiles')
    .select('onboarding_status, role_type')
    .eq('user_id', userId)
    .maybeSingle<BaseProfileRow>();

const fetchChannels = async (supabase: SupabaseClient, userId: string) =>
  supabase
    .from('influencer_channels')
    .select(
      'id, platform, channel_name, channel_url, verification_status, last_verified_at, audience_size, upload_frequency',
    )
    .eq('influencer_id', userId)
    .order('created_at', { ascending: true })
    .returns<ChannelRow[]>();

const upsertProfileRow = async (
  supabase: SupabaseClient,
  userId: string,
  birthDate: string,
): Promise<NullableResult> => {
  const existing = await fetchProfileRow(supabase, userId);

  if (existing.error) {
    return failure(
      500,
      influencerErrorCodes.supabaseFailure,
      '인플루언서 프로필 정보를 확인하지 못했습니다.',
      existing.error.message,
    );
  }

  if (existing.data) {
    const updateResult = await supabase
      .from('influencer_profiles')
      .update({ birth_date: birthDate, verification_status: 'approved' })
      .eq('influencer_id', userId);

    if (updateResult.error) {
      return failure(
        500,
        influencerErrorCodes.supabaseFailure,
        '인플루언서 프로필 정보를 갱신하지 못했습니다.',
        updateResult.error.message,
      );
    }

    return success(null);
  }

  const insertResult = await supabase.from('influencer_profiles').insert({
    influencer_id: userId,
    birth_date: birthDate,
    verification_status: 'approved',
  });

  if (insertResult.error) {
    return failure(
      500,
      influencerErrorCodes.supabaseFailure,
      '인플루언서 프로필을 생성하지 못했습니다.',
      insertResult.error.message,
    );
  }

  return success(null);
};

const upsertChannels = async (
  supabase: SupabaseClient,
  userId: string,
  channels: InfluencerChannelInput[],
  logger: AppLogger,
): Promise<NullableResult> => {
  const existingChannels = await supabase
    .from('influencer_channels')
    .select(
      'id, platform, channel_url, verification_status, last_verified_at, audience_size, upload_frequency',
    )
    .eq('influencer_id', userId)
    .returns<
      Array<{
        id: number;
        platform: string;
        channel_url: string;
        verification_status: VerificationStatus;
        last_verified_at: string | null;
        audience_size: number | null;
        upload_frequency: UploadFrequency;
      }>
    >();

  if (existingChannels.error) {
    return failure(
      500,
      influencerErrorCodes.supabaseFailure,
      '채널 정보를 확인하지 못했습니다.',
      existingChannels.error.message,
    );
  }

  const rows = channels.map((channel) => ({
    influencer_id: userId,
    platform: channel.platform,
    channel_name: channel.channelName,
    channel_url: channel.channelUrl,
    audience_size:
      typeof channel.audienceSize === 'number' ? channel.audienceSize : null,
    verification_status: 'approved',
    last_verified_at: new Date().toISOString(),
    upload_frequency: channel.uploadFrequency,
  }));

  const upsertResult = await supabase
    .from('influencer_channels')
    .upsert(rows, {
      onConflict: 'influencer_id,platform,channel_url',
    });

  if (upsertResult.error) {
    logger.error('Failed to upsert influencer channels', upsertResult.error);
    return failure(
      500,
      influencerErrorCodes.supabaseFailure,
      '채널 정보를 저장하지 못했습니다.',
      upsertResult.error.message,
    );
  }

  const keepKeys = new Set(
    rows.map((row) => `${row.platform.toLowerCase()}|${row.channel_url.toLowerCase()}`),
  );
  const obsoleteIds = (existingChannels.data ?? [])
    .filter(
      (channel) =>
        !keepKeys.has(`${channel.platform.toLowerCase()}|${channel.channel_url.toLowerCase()}`),
    )
    .map((channel) => channel.id);

  if (obsoleteIds.length > 0) {
    const deleteResult = await supabase
      .from('influencer_channels')
      .delete()
      .in('id', obsoleteIds);

    if (deleteResult.error) {
      logger.warn('Failed to remove obsolete influencer channels', {
        message: deleteResult.error.message,
        ids: obsoleteIds,
      });
    }
  }

  return success(null);
};

export const getInfluencerProfile = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const [baseProfileResult, profileResult, channelsResult] = await Promise.all([
    fetchBaseProfileRow(supabase, userId),
    fetchProfileRow(supabase, userId),
    fetchChannels(supabase, userId),
  ]);

  if (baseProfileResult.error) {
    return failure(
      500,
      influencerErrorCodes.profileFetchFailed,
      '기본 프로필 정보를 조회하지 못했습니다.',
      baseProfileResult.error.message,
    );
  }

  if (profileResult.error) {
    return failure(
      500,
      influencerErrorCodes.profileFetchFailed,
      '인플루언서 프로필 정보를 조회하지 못했습니다.',
      profileResult.error.message,
    );
  }

  if (channelsResult.error) {
    return failure(
      500,
      influencerErrorCodes.profileFetchFailed,
      '인플루언서 채널 정보를 조회하지 못했습니다.',
      channelsResult.error.message,
    );
  }

  return success(
    mapProfile(
      baseProfileResult.data ?? null,
      profileResult.data,
      channelsResult.data ?? [],
    ),
    200,
  );
};

export const upsertInfluencerProfile = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  payload: InfluencerProfilePayload,
) => {
  const ageError = ensureAgeRequirement(payload.birthDate);
  if (ageError) {
    return ageError;
  }

  const duplicateError = ensureChannelUniqueness(payload.channels);
  if (duplicateError) {
    return duplicateError;
  }

  const profileResult = await upsertProfileRow(
    supabase,
    userId,
    payload.birthDate,
  );

  if (!profileResult.ok) {
    return profileResult;
  }

  const channelResult = await upsertChannels(
    supabase,
    userId,
    payload.channels,
    logger,
  );

  if (!channelResult.ok) {
    return channelResult;
  }

  const onboardingUpdate = await supabase
    .from('profiles')
    .update({ onboarding_status: 'completed' })
    .eq('user_id', userId)
    .eq('role_type', 'influencer')
    .eq('onboarding_status', 'pending');

  if (onboardingUpdate.error) {
    logger.warn('Failed to update onboarding status', {
      message: onboardingUpdate.error.message,
      userId,
    });
  }

  return getInfluencerProfile(supabase, userId);
};

export type InfluencerServiceError = InfluencerErrorCode;








