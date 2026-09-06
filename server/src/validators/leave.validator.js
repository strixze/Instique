import { z } from 'zod';

export const createLeaveSchema = z.object({
  studentId: z.string().optional(),
  type: z.enum(['sick', 'casual', 'personal', 'emergency', 'earned', 'vacation', 'other']).optional(),
  leaveType: z.enum(['sick', 'casual', 'personal', 'emergency', 'earned', 'vacation', 'other']).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isPartialDay: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().min(2, 'Reason must be at least 2 characters'),
  document: z.object({
    name: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
});

export const approveLeaveSchema = z.object({
  assignments: z.array(
    z.object({
      timetableId: z.string().optional(),
      lectureKey: z.string().optional(),
      date: z.string().min(1, 'Date is required'),
      day: z.number().min(0).max(6),
      periodNo: z.number().min(1),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
      subjectId: z.string().optional(),
      classId: z.string().optional(),
      sectionId: z.string().optional(),
      room: z.string().optional(),
      originalTeacherId: z.string().optional(),
      substituteTeacherId: z.string().min(1, 'Substitute teacher ID is required'),
    })
  ).optional().default([]),
});

export const rejectLeaveSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
});
