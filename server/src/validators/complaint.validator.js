import { z } from 'zod';

export const createComplaintSchema = z.object({
  type: z.enum(['student', 'parent']),
  subject: z.string().min(1),
  description: z.string().min(1),
  isAnonymous: z.boolean().optional(),
});

export const processComplaintSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  resolution: z.string().optional(),
});
