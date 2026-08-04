import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isCurrent: z.boolean().optional(),
});

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  classTeacher: z.string().optional().or(z.literal('')).transform((val) => val || undefined),
  order: z.number().optional(),
});

export const createSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  schoolClass: z.string().min(1, 'Class is required'),
  roomNo: z.string().optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  type: z.enum(['core', 'elective', 'co-curricular']).optional(),
  classes: z.array(z.string()).optional(),
  weeklyPeriods: z.number().optional(),
  maxMarks: z.number().optional(),
  passMarks: z.number().optional(),
});
