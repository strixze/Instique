import { z } from 'zod';

export const createLeaveSchema = z.object({
  type: z.enum(['sick', 'personal', 'emergency', 'vacation', 'other']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(1),
});

export const processLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
  substituteTeacher: z.string().optional(),
});
