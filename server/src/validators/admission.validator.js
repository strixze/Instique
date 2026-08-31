import { z } from 'zod';

export const createAdmissionSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  aadhaarId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  applyingForClass: z.string().min(1, 'Applying class is required'),
  academicSession: z.string().min(1, 'Academic session is required'),
  parentPhone: z.string().min(1, 'Parent phone number is required'),
  parentEmail: z.string().optional(),
  father: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    occupation: z.string().optional()
  }).optional(),
  mother: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    occupation: z.string().optional()
  }).optional(),
  guardian: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional()
  }).optional(),
});

export const updateAdmissionStatusSchema = z.object({
  workflowStatus: z.enum([
    'draft', 'submitted', 'document_verification', 'under_review', 
    'approved', 'rejected', 'class_allocated', 'fee_assigned', 
    'payment_pending', 'partially_paid', 'paid', 'admitted', 'student_created'
  ]),
  remarks: z.string().optional(),
});

export const updateDocumentStatusSchema = z.object({
  status: z.enum(['uploaded', 'pending', 'verified', 'rejected']),
  rejectionReason: z.string().optional(),
});

export const allocateClassSectionSchema = z.object({
  assignedClassId: z.string().min(1, 'Class is required'),
  assignedSectionId: z.string().min(1, 'Section is required'),
});

export const assignFeeStructureSchema = z.object({
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  discountName: z.string().optional(),
  discountValue: z.number().or(z.string()).optional(),
  installments: z.array(z.number().positive()).optional(),
});

export const recordManualPaymentSchema = z.object({
  amountPaid: z.number().or(z.string()),
  paymentMethod: z.enum(['cash', 'cheque', 'bank_transfer', 'other']),
  referenceNo: z.string().optional(),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});
