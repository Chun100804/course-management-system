import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(5000),
  instructor: z.string().trim().min(2).max(120),
  fee: z.number().finite().min(0),
  capacity: z.number().int().min(1),
});