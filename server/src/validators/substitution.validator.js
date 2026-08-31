import { z } from 'zod';

export const eligibleTeachersQuerySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  day: z.string().or(z.number()),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  periodNo: z.string().or(z.number()).optional(),
  originalTeacherId: z.string().optional(),
  subjectId: z.string().optional(),
  classId: z.string().optional(),
});

export const assignSubstituteSchema = z.object({
  substituteTeacherId: z.string().min(1, 'Substitute teacher ID is required'),
  notes: z.string().optional(),
});

export const cancelSubstitutionSchema = z.object({
  reason: z.string().optional(),
});
