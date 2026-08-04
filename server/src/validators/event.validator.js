import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['holiday', 'exam', 'event', 'ptm', 'sports_day', 'annual_day', 'deadline']),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isFullDay: z.boolean().optional(),
  color: z.string().optional(),
  targetClasses: z.array(z.string()).optional(),
});
