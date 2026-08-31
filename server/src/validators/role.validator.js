import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.record(z.array(z.string())),
});

export const assignRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
});
