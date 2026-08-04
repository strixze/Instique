import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  admissionNo: z.string().min(1, 'Admission number is required'),
  currentClass: z.string().optional(),
  currentSection: z.string().optional(),
  contact: z.object({ phone: z.string().optional(), email: z.string().optional(), address: z.string().optional() }).optional(),
  emergencyContacts: z.array(z.object({ name: z.string(), relation: z.string(), phone: z.string() })).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();
