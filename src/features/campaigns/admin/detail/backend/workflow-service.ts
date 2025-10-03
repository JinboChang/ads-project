import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success } from '@/backend/http/response';
import type { AppLogger } from '@/backend/hono/context';
import {
  ApproveApplicantsRequestSchema,
  CloseCampaignRequestSchema,
  ReopenCampaignRequestSchema,
  type ApproveApplicantsRequest,
  type CloseCampaignRequest,
  type ReopenCampaignRequest,
} from '@/features/campaigns/lib/dto';
import {
  advertiserCampaignDetailErrorCodes,
  type AdvertiserCampaignDetailErrorCode,
} from '@/features/campaigns/admin/detail/backend/error';
import {
  CampaignWorkflowResultSchema,
  type CampaignWorkflowResult,
} from '@/features/campaigns/admin/detail/backend/schema';
import {
  createEmptyStats,
  fetchAdvertiserProfile,
  fetchCampaignRow,
  mapCampaignRowToSummary,
  type CampaignRow,
} from '@/features/campaigns/admin/detail/backend/service';
import { fetchCampaignStatsMap } from '@/features/campaigns/admin/backend/stats-service';
import type { ApplicationStatus } from '@/features/campaigns/lib/dto';

const CAMPAIGNS_TABLE = 'campaigns';
const APPLICATIONS_TABLE = 'applications';
const APPLICATION_EVENTS_TABLE = 'application_events';

const nowIsoString = () => new Date().toISOString();

type ApplicationStatusDetailedRow = {
  id: number;
  status: ApplicationStatus;
  status_updated_at: string | null;
};

type EnsureCampaignResult =
  | CampaignRow
  | ReturnType<typeof failure<AdvertiserCampaignDetailErrorCode>>;

const ensureProfileAndCampaign = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  campaignId: number,
) : Promise<EnsureCampaignResult> => {
  const profileResult = await fetchAdvertiserProfile(supabase, userId);

  if (profileResult.error) {
    logger.error('Failed to fetch advertiser profile for workflow', profileResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      '광고주 정보를 확인하지 못했습니다.',
      profileResult.error.message,
    );
  }

  if (!profileResult.data) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      403,
      advertiserCampaignDetailErrorCodes.forbidden,
      '광고주 전용 기능입니다.',
    );
  }

  if (profileResult.data.verification_status !== 'approved') {
    return failure<AdvertiserCampaignDetailErrorCode>(
      403,
      advertiserCampaignDetailErrorCodes.profileUnverified,
      '광고주 프로필 검증이 완료된 이후에 이용 가능합니다.',
    );
  }

  const campaignResult = await fetchCampaignRow(supabase, campaignId);

  if (campaignResult.error) {
    logger.error('Failed to fetch campaign for workflow', campaignResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      '체험단 정보를 확인하지 못했습니다.',
      campaignResult.error.message,
    );
  }

  if (!campaignResult.data) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      404,
      advertiserCampaignDetailErrorCodes.campaignNotFound,
      '요청한 체험단을 찾을 수 없습니다.',
    );
  }

  if (campaignResult.data.advertiser_id !== userId) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      403,
      advertiserCampaignDetailErrorCodes.forbidden,
      '해당 체험단을 관리할 권한이 없습니다.',
    );
  }

  return campaignResult.data;
};

const buildWorkflowSuccess = async (
  supabase: SupabaseClient,
  campaignRow: Parameters<typeof mapCampaignRowToSummary>[0],
) => {
  let stats;
  try {
    const statsMap = await fetchCampaignStatsMap(supabase, [campaignRow.id]);
    stats = statsMap.get(campaignRow.id) ?? createEmptyStats();
  } catch {
    stats = createEmptyStats();
  }

  const summary = mapCampaignRowToSummary(campaignRow, stats);
  const parsed = CampaignWorkflowResultSchema.safeParse({ campaign: summary });
  return parsed.success ? parsed.data : { campaign: summary } satisfies CampaignWorkflowResult;
};

export const closeCampaign = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  campaignId: number,
  payload: CloseCampaignRequest,
) => {
  const parsed = CloseCampaignRequestSchema.safeParse(payload ?? {});

  if (!parsed.success) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      400,
      advertiserCampaignDetailErrorCodes.invalidParams,
      '모집 종료 요청 값이 유효하지 않습니다.',
      parsed.error.format(),
    );
  }

  const campaignEnsureResult = await ensureProfileAndCampaign(
    supabase,
    logger,
    userId,
    campaignId,
  );

  if ('ok' in campaignEnsureResult) {
    return campaignEnsureResult;
  }

  const campaignRow = campaignEnsureResult;

  if (campaignRow.status !== 'recruiting') {
    return failure<AdvertiserCampaignDetailErrorCode>(
      400,
      advertiserCampaignDetailErrorCodes.invalidState,
      '모집중 상태에서만 모집 종료를 수행할 수 있습니다.',
    );
  }

  const updateResult = await supabase
    .from(CAMPAIGNS_TABLE)
    .update({ status: 'recruitment_closed', updated_at: nowIsoString() })
    .eq('id', campaignRow.id)
    .eq('advertiser_id', userId)
    .select(
      'id, advertiser_id, title, benefit_summary, mission_details, store_location, status, application_start_at, application_end_at, max_participants, created_at, updated_at',
    )
    .maybeSingle<typeof campaignRow>();

  if (updateResult.error || !updateResult.data) {
    logger.error('Failed to update campaign status to recruitment_closed', updateResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      '모집 종료 처리에 실패했습니다.',
      updateResult.error?.message,
    );
  }

  const workflowResult = await buildWorkflowSuccess(supabase, updateResult.data);
  return success(workflowResult, 200);
};

export const approveApplicants = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  campaignId: number,
  payload: ApproveApplicantsRequest,
) => {
  const parsed = ApproveApplicantsRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      400,
      advertiserCampaignDetailErrorCodes.invalidParams,
      '선정 요청 값이 유효하지 않습니다.',
      parsed.error.format(),
    );
  }

  const campaignEnsureResult = await ensureProfileAndCampaign(
    supabase,
    logger,
    userId,
    campaignId,
  );

  if ('ok' in campaignEnsureResult) {
    return campaignEnsureResult;
  }

  const campaignRow = campaignEnsureResult;

  if (campaignRow.status !== 'recruitment_closed') {
    return failure<AdvertiserCampaignDetailErrorCode>(
      400,
      advertiserCampaignDetailErrorCodes.invalidState,
      '모집 종료 상태에서만 지원자를 선정할 수 있습니다.',
    );
  }

  const applicationResult = await supabase
    .from(APPLICATIONS_TABLE)
    .select('id, status, status_updated_at')
    .eq('campaign_id', campaignRow.id)
    .returns<ApplicationStatusDetailedRow[]>();

  if (applicationResult.error) {
    logger.error('Failed to fetch applications for approval', applicationResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      '지원자 정보를 불러오지 못했습니다.',
      applicationResult.error.message,
    );
  }

  const applicationRows = applicationResult.data ?? [];
  const applicationsById = new Map<number, ApplicationStatusDetailedRow>();
  applicationRows.forEach((row) => applicationsById.set(row.id, row));

  const selectedIds = new Set(parsed.data.applicantIds);
  const selectedRows: ApplicationStatusDetailedRow[] = [];

  for (const id of selectedIds) {
    const row = applicationsById.get(id);
    if (!row) {
      return failure<AdvertiserCampaignDetailErrorCode>(
        400,
        advertiserCampaignDetailErrorCodes.unknownApplicants,
        '선정 대상에 알 수 없는 지원자가 포함되어 있습니다.',
      );
    }
    selectedRows.push(row);
  }

  const alreadyApproved = applicationRows.filter((row) => row.status === 'approved');
  const newlyApprovingRows = selectedRows.filter((row) => row.status !== 'approved');

  const totalApprovedAfter = alreadyApproved.length + newlyApprovingRows.length;

  if (totalApprovedAfter > campaignRow.max_participants) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      400,
      advertiserCampaignDetailErrorCodes.approvalQuotaExceeded,
      '선정 인원이 모집 정원을 초과했습니다.',
    );
  }

  const now = nowIsoString();

  if (newlyApprovingRows.length > 0) {
    const updateApproved = await supabase
      .from(APPLICATIONS_TABLE)
      .update({ status: 'approved', status_updated_at: now })
      .in('id', newlyApprovingRows.map((row) => row.id))
      .eq('campaign_id', campaignRow.id);

    if (updateApproved.error) {
      logger.error('Failed to approve applicants', updateApproved.error);
      return failure<AdvertiserCampaignDetailErrorCode>(
        500,
        advertiserCampaignDetailErrorCodes.supabaseFailure,
        '선정 처리에 실패했습니다.',
        updateApproved.error.message,
      );
    }

    const approvalEvents = newlyApprovingRows.map((row) => ({
      application_id: row.id,
      performed_by: userId,
      event_type: 'status_changed',
      from_status: row.status,
      to_status: 'approved',
      recorded_at: now,
      context: parsed.data.note
        ? { note: parsed.data.note }
        : { reason: 'approved_by_advertiser' },
    }));

    const approvalEventsResult = await supabase
      .from(APPLICATION_EVENTS_TABLE)
      .insert(approvalEvents);

    if (approvalEventsResult.error) {
      logger.warn('Failed to record approval events', approvalEventsResult.error);
    }
  }

  const autoRejectRemaining = parsed.data.autoRejectRemaining ?? true;
  const remainingSubmitted = applicationRows.filter(
    (row) => row.status === 'submitted' && !selectedIds.has(row.id),
  );

  if (autoRejectRemaining) {
    const rejectResult = await supabase
      .from(APPLICATIONS_TABLE)
      .update({ status: 'rejected', status_updated_at: now })
      .eq('campaign_id', campaignRow.id)
      .eq('status', 'submitted');

    if (rejectResult.error) {
      logger.error('Failed to reject remaining applicants', rejectResult.error);
      return failure<AdvertiserCampaignDetailErrorCode>(
        500,
        advertiserCampaignDetailErrorCodes.supabaseFailure,
        '선정되지 않은 지원자 처리에 실패했습니다.',
        rejectResult.error.message,
      );
    }

    if (remainingSubmitted.length > 0) {
      const rejectionEvents = remainingSubmitted.map((row) => ({
        application_id: row.id,
        performed_by: userId,
        event_type: 'status_changed',
        from_status: row.status,
        to_status: 'rejected',
        recorded_at: now,
        context: { reason: 'auto_rejected_after_selection' },
      }));

      const rejectionEventsResult = await supabase
        .from(APPLICATION_EVENTS_TABLE)
        .insert(rejectionEvents);

      if (rejectionEventsResult.error) {
        logger.warn('Failed to record rejection events', rejectionEventsResult.error);
      }
    }
  }

  const refreshedCampaign = await fetchCampaignRow(supabase, campaignRow.id);

  if (refreshedCampaign.error || !refreshedCampaign.data) {
    logger.error('Failed to refetch campaign after approval', refreshedCampaign.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      '선정 결과를 가져오지 못했습니다.',
      refreshedCampaign.error?.message,
    );
  }

  const workflowResult = await buildWorkflowSuccess(supabase, refreshedCampaign.data);
  return success(workflowResult, 200);
};

export const reopenCampaign = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  userId: string,
  campaignId: number,
  payload: ReopenCampaignRequest,
) => {
  const parsed = ReopenCampaignRequestSchema.safeParse(payload ?? {});

  if (!parsed.success) {
    return failure<AdvertiserCampaignDetailErrorCode>(
      400,
      advertiserCampaignDetailErrorCodes.invalidParams,
      '재모집 요청 값이 유효하지 않습니다.',
      parsed.error.format(),
    );
  }

  const campaignEnsureResult = await ensureProfileAndCampaign(
    supabase,
    logger,
    userId,
    campaignId,
  );

  if ('ok' in campaignEnsureResult) {
    return campaignEnsureResult;
  }

  const campaignRow = campaignEnsureResult;

  if (campaignRow.status !== 'recruitment_closed') {
    return failure<AdvertiserCampaignDetailErrorCode>(
      400,
      advertiserCampaignDetailErrorCodes.invalidState,
      '모집 종료 상태에서만 재모집을 시작할 수 있습니다.',
    );
  }

  const updatePayload: Record<string, unknown> = {
    status: 'recruiting',
    updated_at: nowIsoString(),
  };

  if (parsed.data.applicationStartAt && parsed.data.applicationEndAt) {
    updatePayload.application_start_at = parsed.data.applicationStartAt;
    updatePayload.application_end_at = parsed.data.applicationEndAt;
  }

  const updateResult = await supabase
    .from(CAMPAIGNS_TABLE)
    .update(updatePayload)
    .eq('id', campaignRow.id)
    .eq('advertiser_id', userId)
    .select(
      'id, advertiser_id, title, benefit_summary, mission_details, store_location, status, application_start_at, application_end_at, max_participants, created_at, updated_at',
    )
    .maybeSingle<typeof campaignRow>();

  if (updateResult.error || !updateResult.data) {
    logger.error('Failed to reopen campaign', updateResult.error);
    return failure<AdvertiserCampaignDetailErrorCode>(
      500,
      advertiserCampaignDetailErrorCodes.supabaseFailure,
      '재모집 처리에 실패했습니다.',
      updateResult.error?.message,
    );
  }

  const workflowResult = await buildWorkflowSuccess(supabase, updateResult.data);
  return success(workflowResult, 200);
};

export type AdvertiserCampaignWorkflowError = AdvertiserCampaignDetailErrorCode;
