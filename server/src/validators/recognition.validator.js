import { z } from 'zod';

export const awardPointsSchema = z.object({
  student: z.string().min(1),
  points: z.number().positive(),
  category: z.enum(['academic', 'behavior', 'participation', 'sports', 'leadership', 'other']).optional(),
  note: z.string().optional(),
});

export const createBadgeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['star_student', 'homework_hero', 'perfect_attendance', 'helpful_student', 'custom']).optional(),
  criteria: z.record(z.any()).optional(),
});

export const awardBadgeSchema = z.object({
  student: z.string().min(1),
});
