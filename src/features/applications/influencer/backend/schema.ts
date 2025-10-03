import { z } from 'zod';
import {
  MyApplicationsResponseSchema,
  myApplicationStatusFilterValues,
} from '@/features/applications/lib/dto';

export const InfluencerApplicationsQuerySchema = z.object({
  status: z.enum(myApplicationStatusFilterValues).optional(),
});

export type InfluencerApplicationsQuery = z.infer<typeof InfluencerApplicationsQuerySchema>;

export const InfluencerApplicationsResponseSchema = MyApplicationsResponseSchema;
