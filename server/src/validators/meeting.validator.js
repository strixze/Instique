import { z } from 'zod';

export const MEETING_TYPES = [
  'parent_teacher_meeting',
  'academic_review',
  'progress_discussion',
  'behaviour_discussion',
  'general',
  'other',
];

export const MEETING_STATUSES = ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'];
export const RSVP_STATUSES = ['PENDING', 'GOING', 'NOT_GOING', 'MAYBE'];
export const ATTENDANCE_STATUSES = ['PENDING', 'ATTENDED', 'ABSENT', 'NOT_SCHEDULED'];
export const NOTE_VISIBILITIES = ['INTERNAL', 'PARENT_VISIBLE'];

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const classSelectionSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().optional().nullable(),
});

const teacherAssignmentSchema = z.object({
  teacherId: z.string().min(1, 'Teacher is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().optional().nullable(),
});

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(200),
  type: z.enum(MEETING_TYPES).default('parent_teacher_meeting'),
  description: z.string().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format'),
  location: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  classes: z.array(classSelectionSchema).min(1, 'At least one class is required'),
  teachers: z.array(teacherAssignmentSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.startTime >= data.endTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endTime'],
      message: 'End time must be after start time',
    });
  }
  const date = new Date(data.date);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['date'],
      message: 'Date is invalid',
    });
  }
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(200).optional(),
  type: z.enum(MEETING_TYPES).optional(),
  description: z.string().optional().nullable(),
  date: z.string().optional(),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format').optional(),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format').optional(),
  location: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  classes: z.array(classSelectionSchema).min(1, 'At least one class is required').optional(),
  teachers: z.array(teacherAssignmentSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endTime'],
      message: 'End time must be after start time',
    });
  }
  if (data.date) {
    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['date'],
        message: 'Date is invalid',
      });
    }
  }
});

export const publishMeetingSchema = z.object({});

export const cancelMeetingSchema = z.object({
  reason: z.string().optional().nullable(),
});

export const rsvpSchema = z.object({
  rsvpStatus: z.enum(RSVP_STATUSES, { message: 'Invalid RSVP status' }),
});

export const attendanceSchema = z.object({
  participantId: z.string().min(1, 'Participant is required'),
  status: z.enum(['ATTENDED', 'ABSENT', 'PENDING'], { message: 'Invalid attendance status' }),
});

export const bulkAttendanceSchema = z.object({
  updates: z.array(z.object({
    participantId: z.string().min(1, 'Participant is required'),
    status: z.enum(['ATTENDED', 'ABSENT', 'PENDING'], { message: 'Invalid attendance status' }),
  })).min(1, 'At least one update is required'),
});

export const noteSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  note: z.string().min(1, 'Note cannot be empty').max(5000),
  visibility: z.enum(NOTE_VISIBILITIES).default('INTERNAL'),
});

export const updateNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(5000).optional(),
  visibility: z.enum(NOTE_VISIBILITIES).optional(),
});

export const meetingPreviewSchema = z.object({
  classes: z.array(classSelectionSchema).min(1, 'At least one class is required'),
});