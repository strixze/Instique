import { z } from 'zod';

const chapterSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
  totalClasses: z.number().optional(),
});

export const createSyllabusSchema = z.object({
  subject: z.string().min(1),
  schoolClass: z.string().min(1),
  academicYear: z.string().min(1),
  chapters: z.array(chapterSchema).optional(),
});

export const updateProgressSchema = z.object({
  chapterIndex: z.number().min(0),
  completedClasses: z.number().min(0),
});
