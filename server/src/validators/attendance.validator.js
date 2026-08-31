import { z } from 'zod';

const studentStatusSchema = z.object({
  student: z.string(),
  status: z.enum(['present', 'absent', 'late', 'holiday', 'leave']),
});

export const markAttendanceSchema = z.object({
  date: z.string().min(1),
  schoolClass: z.string().min(1),
  section: z.string().optional(),
  subject: z.string().optional(),
  period: z.number().optional(),
  students: z.array(studentStatusSchema).min(1),
});

export const bulkMarkAttendanceSchema = z.object({
  date: z.string().min(1),
  schoolClass: z.string().min(1),
  section: z.string().optional(),
  subject: z.string().optional(),
  markAllPresent: z.boolean().optional(),
  absentStudentIds: z.array(z.string()).optional(),
});
