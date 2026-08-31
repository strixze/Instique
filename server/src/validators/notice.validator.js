import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(['general', 'academic', 'event', 'emergency', 'holiday', 'circular']).optional(),
  scope: z.enum(['school', 'class', 'teacher', 'student']).optional(),
  targetClasses: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  schedule: z.object({ publishAt: z.string().optional(), expireAt: z.string().optional() }).optional(),
});
