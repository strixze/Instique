import { z } from 'zod';

export const createHomeworkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  subject: z.string().min(1),
  schoolClass: z.string().min(1),
  section: z.string().optional(),
  dueDate: z.string().min(1),
  isTemplate: z.boolean().optional(),
});

export const submitHomeworkSchema = z.object({
  content: z.string().optional(),
});
