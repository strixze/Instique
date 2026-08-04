import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  teacher: z.string().min(1),
  invitedParents: z.array(z.string()).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
