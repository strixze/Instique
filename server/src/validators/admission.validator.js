import { z } from 'zod';

export const createAdmissionSchema = z.object({
  applicantName: z.string().min(1, 'Applicant name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  applyingForClass: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().min(1, 'Parent phone is required'),
  parentEmail: z.string().optional(),
  address: z.string().optional(),
});

export const updateAdmissionStatusSchema = z.object({
  workflowStatus: z.enum(['submitted', 'document_upload', 'verification', 'approved', 'rejected', 'fee_paid', 'enrolled']),
  remarks: z.string().optional(),
});
