import { z } from 'zod';
import {
  InfluencerChannelInputSchema,
  InfluencerProfileInputSchema,
  InfluencerProfileResponseSchema,
} from '@/features/influencer/lib/dto';

export type { InfluencerChannelInput, UploadFrequency } from '@/features/influencer/lib/dto';

export const InfluencerProfilePayloadSchema = InfluencerProfileInputSchema;
export const InfluencerProfileChannelSchema = InfluencerChannelInputSchema;
export const InfluencerProfileResponseBodySchema =
  InfluencerProfileResponseSchema;

export type InfluencerProfilePayload = z.infer<
  typeof InfluencerProfilePayloadSchema
>;
export type InfluencerProfileResponse = z.infer<
  typeof InfluencerProfileResponseBodySchema
>;

