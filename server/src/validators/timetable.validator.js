import { z } from 'zod';

const periodSchema = z.object({
  day: z.number().min(0).max(6),
  periodNo: z.number().min(1),
  subject: z.string().nullable().optional(),
  teacher: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
  isLunch: z.boolean().optional(),
  isBreak: z.boolean().optional(),
  isAssembly: z.boolean().optional(),
  isFixed: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  label: z.string().optional(),
  isConsecutiveStart: z.boolean().optional(),
  consecutiveGroupId: z.string().optional(),
});

export const generateTimetableSchema = z.object({
  schoolClass: z.string().min(1),
  section: z.string().optional(),
  academicYear: z.string().min(1),
  configId: z.string().optional(),
});

export const updateTimetableSchema = z.object({
  periods: z.array(periodSchema),
});

export const manualEditSchema = z.object({
  day: z.number().min(0).max(6),
  periodNo: z.number().min(1),
  subject: z.string().nullable().optional(),
  teacher: z.string().nullable().optional(),
  room: z.string().optional(),
});

export const swapPeriodsSchema = z.object({
  sourceDay: z.number().min(0).max(6),
  sourcePeriodNo: z.number().min(1),
  targetDay: z.number().min(0).max(6),
  targetPeriodNo: z.number().min(1),
});

export const lockPeriodsSchema = z.object({
  lockedPeriods: z.array(z.object({
    day: z.number().min(0).max(6),
    periodNo: z.number().min(1),
  })),
});

export const publishTimetableSchema = z.object({
  status: z.enum(['draft', 'published']),
});

export const deleteClassTimetablesSchema = z.object({
  academicYear: z.string().min(1),
});

export const deleteSchoolTimetablesSchema = z.object({
  academicYear: z.string().min(1),
});

export const bulkPublishClassSchema = z.object({
  academicYear: z.string().min(1),
  status: z.enum(['draft', 'published']),
});

export const bulkPublishSchoolSchema = z.object({
  academicYear: z.string().min(1),
  status: z.enum(['draft', 'published']),
});


