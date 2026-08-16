import { z } from 'zod';

const examSubjectSchema = z.object({
  subject: z.string(),
  maxMarks: z.number(),
  passMarks: z.number(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const createExamSchema = z.object({
  name: z.string().min(1),
  academicYear: z.string().min(1),
  schoolClass: z.string().min(1),
  subjects: z.array(examSubjectSchema).min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  type: z.enum(['midterm', 'final', 'quarterly', 'half_yearly', 'weekly', 'unit_test']).optional(),
});

export const enterMarkSchema = z.object({
  exam: z.string().min(1),
  subject: z.string().min(1),
  student: z.string().min(1),
  marksObtained: z.number().min(0),
  remarks: z.string().optional(),
});

export const saveMarksSchema = z.object({
  marks: z.array(z.object({
    student: z.string().min(1),
    subject: z.string().min(1),
    marksObtained: z.number().min(0),
  })).min(1),
  status: z.enum(['draft', 'submitted']).optional(),
});
