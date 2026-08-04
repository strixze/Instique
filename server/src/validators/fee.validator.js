import { z } from 'zod';

const feeCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['admission', 'tuition', 'transport', 'library', 'sports', 'lab', 'development', 'other']),
  amount: z.number().positive(),
  isOptional: z.boolean().optional(),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'half_yearly', 'annual']).optional(),
});

export const createFeeStructureSchema = z.object({
  name: z.string().min(1),
  academicYear: z.string().min(1),
  schoolClass: z.array(z.string()).min(1),
  categories: z.array(feeCategorySchema).min(1),
  lateFeePerDay: z.number().optional(),
});

export const recordPaymentSchema = z.object({
  student: z.string().min(1),
  feeStructure: z.string().min(1),
  academicYear: z.string().min(1),
  amount: z.number().positive(),
  paidAmount: z.number().positive(),
  paymentMethod: z.enum(['cash', 'cheque', 'online', 'bank_transfer']),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});
