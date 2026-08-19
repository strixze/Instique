import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['ptm', 'academic_review', 'progress_discussion', 'behaviour_discussion', 'general', 'other']).optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Meeting date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  instructions: z.string().optional(),
  targetClasses: z.array(z.string()).min(1, 'At least one class must be selected'),
  targetSections: z.array(z.string()).optional(),
  assignedTeachers: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(['ptm', 'academic_review', 'progress_discussion', 'behaviour_discussion', 'general', 'other']).optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  instructions: z.string().optional(),
  targetClasses: z.array(z.string()).optional(),
  targetSections: z.array(z.string()).optional(),
  assignedTeachers: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
});

export const rsvpSchema = z.object({
  studentId: z.string().optional(),
  response: z.enum(['going', 'not_going', 'maybe']),
});

export const attendanceSchema = z.object({
  parentId: z.string().min(1, 'Parent ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  status: z.enum(['pending', 'attended', 'absent', 'cancelled']),
});

export const noteSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  academicNotes: z.string().optional(),
  behaviourNotes: z.string().optional(),
  improvementNotes: z.string().optional(),
  actionItems: z.string().optional(),
  note: z.string().optional(),
  visibility: z.enum(['internal', 'parent_visible']).optional(),
});

