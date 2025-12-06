import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  advertiserErrorCodes,
  type AdvertiserErrorCode,
} from '@/features/advertiser/backend/error';
import type {
  AdvertiserProfilePayload,
  AdvertiserProfileResponse,
} from '@/features/advertiser/backend/schema';

const trimValue = (value: string) => value.trim();

const enqueueBusinessVerification = async (
  logger: AppLogger,
  advertiserId: string,
  payload: AdvertiserProfilePayload,
) => {
  try {
    logger.info('Queued advertiser verification', {
      advertiserId,
      businessRegistrationNumber: payload.businessRegistrationNumber,
    });
    return true;
  } catch (error) {
    logger.warn('Failed to enqueue advertiser verification', error);
    return false;
  }
};

type ProfileRow = {
  company_name: string | null;
  location: string | null;
  business_category: string | null;
  business_reg_number: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes: string | null;
};

const mapProfile = (row: ProfileRow | null): AdvertiserProfileResponse => ({
  companyName: row?.company_name ?? null,
  location: row?.location ?? null,
  businessCategory: row?.business_category ?? null,
  businessRegistrationNumber: row?.business_reg_number ?? null,
  verificationStatus: row?.verification_status ?? 'pending',
  verificationNotes: row?.verification_notes ?? null,
});

const fetchAdvertiserProfileRow = async (
  supabase: SupabaseClient,
  advertiserId: string,
) =>
  supabase
    .from('advertiser_profiles')
    .select(
      'company_name, location, business_category, business_reg_number, verification_status, verification_notes',
    )
    .eq('advertiser_id', advertiserId)
    .maybeSingle<ProfileRow>();

export const getAdvertiserProfile = async (
  supabase: SupabaseClient,
  advertiserId: string,
) => {
  const result = await fetchAdvertiserProfileRow(supabase, advertiserId);

  if (result.error) {
    if (result.error.code === 'PGRST116') {
      return success(
        mapProfile(null),
        200,
      );
    }

    return failure(
      500,
      advertiserErrorCodes.profileFetchFailed,
      'Failed to load advertiser information.',
      result.error.message,
    );
  }

  return success(mapProfile(result.data), 200);
};

const ensureUniqueBusinessNumber = async (
  supabase: SupabaseClient,
  advertiserId: string,
  businessRegistrationNumber: string,
) => {
  const duplicateResult = await supabase
    .from('advertiser_profiles')
    .select('advertiser_id')
    .eq('business_reg_number', businessRegistrationNumber)
    .neq('advertiser_id', advertiserId)
    .maybeSingle<{ advertiser_id: string }>();

  if (duplicateResult.error && duplicateResult.error.code !== 'PGRST116') {
    return failure(
      500,
      advertiserErrorCodes.supabaseFailure,
      'Failed to verify the business registration number.',
      duplicateResult.error.message,
    );
  }

  if (duplicateResult.data) {
    return failure(
      409,
      advertiserErrorCodes.duplicateBusinessRegistration,
      'This business registration number is already registered.',
    );
  }

  return null;
};

const upsertProfileRow = async (
  supabase: SupabaseClient,
  advertiserId: string,
  payload: AdvertiserProfilePayload,
) => {
  const normalized = {
    companyName: trimValue(payload.companyName),
    location: trimValue(payload.location),
    businessCategory: trimValue(payload.businessCategory),
    businessRegistrationNumber: payload.businessRegistrationNumber,
  };

  const existing = await fetchAdvertiserProfileRow(supabase, advertiserId);

  if (existing.error && existing.error.code !== 'PGRST116') {
    return failure(
      500,
      advertiserErrorCodes.supabaseFailure,
      'Failed to load advertiser information.',
      existing.error.message,
    );
  }

  const existingRow = existing.data;

  if (existingRow) {
    const updateResult = await supabase
      .from('advertiser_profiles')
      .update({
        company_name: normalized.companyName,
        location: normalized.location,
        business_category: normalized.businessCategory,
        business_reg_number: normalized.businessRegistrationNumber,
        verification_status: 'approved',
        verification_notes: null,
      })
      .eq('advertiser_id', advertiserId);

    if (updateResult.error) {
      return failure(
        500,
        advertiserErrorCodes.supabaseFailure,
        'Failed to save advertiser information.',
        updateResult.error.message,
      );
    }

    return success(null);
  }

  const insertResult = await supabase.from('advertiser_profiles').insert({
    advertiser_id: advertiserId,
    company_name: normalized.companyName,
    location: normalized.location,
    business_category: normalized.businessCategory,
    business_reg_number: normalized.businessRegistrationNumber,
    verification_status: 'pending',
  });

  if (insertResult.error) {
    return failure(
      500,
      advertiserErrorCodes.supabaseFailure,
      'Failed to save advertiser information.',
      insertResult.error.message,
    );
  }

  return success(null);
};

export const upsertAdvertiserProfile = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  advertiserId: string,
  payload: AdvertiserProfilePayload,
) => {
  const duplicateCheck = await ensureUniqueBusinessNumber(
    supabase,
    advertiserId,
    payload.businessRegistrationNumber,
  );

  if (duplicateCheck) {
    return duplicateCheck;
  }

  const upsertResult = await upsertProfileRow(supabase, advertiserId, payload);

  if (!upsertResult.ok) {
    return upsertResult;
  }

  const queued = await enqueueBusinessVerification(logger, advertiserId, payload);

  if (!queued) {
    return failure(
      500,
      advertiserErrorCodes.verificationEnqueueFailed,
      'Failed to request business verification.',
    );
  }

  const onboardingUpdate = await supabase
    .from('profiles')
    .update({ onboarding_status: 'completed' })
    .eq('user_id', advertiserId)
    .eq('role_type', 'advertiser')
    .eq('onboarding_status', 'pending');

  if (onboardingUpdate.error) {
    logger.warn('Failed to update advertiser onboarding status', {
      message: onboardingUpdate.error.message,
      advertiserId,
    });
  }

  return getAdvertiserProfile(supabase, advertiserId);
};

export type AdvertiserServiceError = AdvertiserErrorCode;


