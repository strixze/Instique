import { z } from 'zod';

export const createHomeworkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional().default(''),
  subject: z.string().min(1, 'Subject is required'),
  schoolClass: z.string().min(1, 'Class is required'),
  section: z.string().optional().nullable(),
  assignedDate: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'published', 'cancelled']).optional().default('published'),
  isTemplate: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).optional(),
});

export const updateHomeworkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  schoolClass: z.string().optional(),
  section: z.string().optional().nullable(),
  assignedDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
  isTemplate: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).optional(),
});

export const submitHomeworkSchema = z.object({
  content: z.string().optional().default(''),
});
