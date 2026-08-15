import { z } from 'zod';

export const createInstallmentConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  percentages: z
    .array(z.number().positive('Each percentage must be a positive number'))
    .min(1, 'At least one installment percentage is required'),
});
