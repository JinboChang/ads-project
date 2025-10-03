import { z } from 'zod';
import {
  AdvertiserProfileInputSchema,
  AdvertiserProfileResponseSchema,
} from '@/features/advertiser/lib/dto';

export const AdvertiserProfilePayloadSchema = AdvertiserProfileInputSchema;
export const AdvertiserProfileResponseBodySchema =
  AdvertiserProfileResponseSchema;

export type AdvertiserProfilePayload = z.infer<
  typeof AdvertiserProfilePayloadSchema
>;
export type AdvertiserProfileResponse = z.infer<
  typeof AdvertiserProfileResponseBodySchema
>;
