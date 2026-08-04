import { z } from 'zod';

const periodSchema = z.object({
  day: z.number().min(0).max(6),
  periodNo: z.number().min(1),
  subject: z.string().optional(),
  teacher: z.string().optional(),
  room: z.string().optional(),
  isLunch: z.boolean().optional(),
  isBreak: z.boolean().optional(),
});

export const generateTimetableSchema = z.object({
  schoolClass: z.string().min(1),
  section: z.string().min(1),
  academicYear: z.string().min(1),
  periodsPerDay: z.number().optional(),
  lunchBreakAfter: z.number().optional(),
});

export const updateTimetableSchema = z.object({
  periods: z.array(periodSchema),
});

export const publishTimetableSchema = z.object({
  status: z.enum(['draft', 'published']),
});
