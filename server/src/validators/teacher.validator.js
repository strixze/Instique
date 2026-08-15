import { z } from 'zod';

export const createTeacherSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  contact: z.object({ phone: z.string().optional(), email: z.string().optional(), address: z.string().optional() }).optional(),
  department: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  assignedClasses: z.array(z.string()).optional(),
  qualifications: z.array(z.object({ degree: z.string(), institution: z.string(), year: z.number() })).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();
