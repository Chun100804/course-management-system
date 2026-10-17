import { z } from 'zod';

export const enrollmentSchema = z.object({ courseId: z.string().min(1) });