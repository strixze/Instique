import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal(''));

export const createTeacherSchema = z.object({
  firstName: z.string({ required_error: 'First name is required' }).trim().min(1, 'First name is required'),
  lastName: z.string({ required_error: 'Last name is required' }).trim().min(1, 'Last name is required'),
  employeeId: z.string({ required_error: 'Employee ID is required' }).trim().min(1, 'Employee ID is required'),
  dateOfBirth: optionalString,
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  contact: z.object({
    phone: optionalString,
    email: z.string({ required_error: 'Teacher email is required' }).trim().email('Invalid email address').min(1, 'Teacher email is required for account activation'),
    address: optionalString,
  }),
  department: optionalString,
  subjects: z.array(z.string()).optional().default([]),
  assignedClasses: z.array(z.string()).optional().default([]),
  qualifications: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
  })).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();
