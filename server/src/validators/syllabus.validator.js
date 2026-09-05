import { z } from 'zod';

const topicSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
  estimatedPeriods: z.number().optional(),
  learningObjectives: z.string().optional(),
});

const chapterSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
  estimatedPeriods: z.number().optional(),
  topics: z.array(topicSchema).optional(),
});

export const createSyllabusSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  subject: z.string().min(1),
  schoolClass: z.string().min(1),
  academicYear: z.string().min(1),
  chapters: z.array(chapterSchema).optional(),
});

export const updateSyllabusSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  chapters: z.array(chapterSchema).optional(),
});

export const assignSectionsSchema = z.object({
  sectionIds: z.array(z.string().min(1)).min(1),
});

export const updateTopicProgressSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
  notes: z.string().optional(),
});
