import { z } from 'zod';

export const createComplaintSchema = z.object({
  type: z.enum(['student', 'parent', 'teacher', 'admin',]).optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  isAnonymous: z.boolean().optional(),
  student: z.string().optional().nullable(),
  studentName: z.string().optional(),
  relatedClass: z.string().optional().nullable(),
  relatedTeacher: z.string().optional().nullable(),
  attachments: z.array(
    z.object({
      url: z.string(),
      fileName: z.string().optional(),
      mimeType: z.string().optional(),
      public_id: z.string().optional(),
    })
  ).optional(),
});

export const processComplaintSchema = z.object({
  status: z.enum(['submitted', 'open', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional().nullable(),
  resolution: z.string().optional(),
  note: z.string().optional(),
});
