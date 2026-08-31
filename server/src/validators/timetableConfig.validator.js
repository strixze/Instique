import { z } from 'zod';

const periodTimingSchema = z.object({
  periodNo: z.number().min(1).max(15),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Must be in HH:MM format" }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Must be in HH:MM format" }),
  type: z.enum(['teaching', 'lunch', 'break', 'assembly']),
  label: z.string().optional(),
});

const fixedEventSchema = z.object({
  day: z.number().min(0).max(6),
  periodNo: z.number().min(1),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
});

export const createConfigSchema = z.object({
  academicYear: z.string().min(1, { message: "Academic Year is required" }),
  workingDays: z.array(z.number().min(0).max(6)).min(1, { message: "At least one working day is required" }),
  periodsPerDay: z.number().min(1).max(15),
  periodTimings: z.array(periodTimingSchema),
  schoolStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  schoolEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  lunchBreaks: z.array(z.object({
    afterPeriod: z.number().min(1),
    durationMinutes: z.number().min(5).max(120),
  })).optional(),
  assemblyConfig: z.object({
    enabled: z.boolean(),
    periodNo: z.number().min(1),
    days: z.array(z.number().min(0).max(6)),
    durationMinutes: z.number().min(5).max(60),
  }).optional(),
  fixedEvents: z.array(fixedEventSchema).optional(),
  defaultTeacherMaxPerDay: z.number().min(1).max(15).optional(),
  defaultTeacherMaxPerWeek: z.number().min(1).max(60).optional(),
  allowEmptyPeriods: z.boolean().optional(),
});

export const updateConfigSchema = createConfigSchema.partial();
