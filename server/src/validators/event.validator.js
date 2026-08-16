import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isFullDay: z.boolean().optional(),
  location: z.string().optional(),
  organizer: z.string().optional(),
  audience: z.array(z.string()).optional(),
  audienceScope: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'cancelled']).optional(),
  color: z.string().optional(),
  targetClasses: z.array(z.string()).optional(),
});
