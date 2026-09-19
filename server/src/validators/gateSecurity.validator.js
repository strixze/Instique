import { z } from 'zod';

export const scanRfidSchema = z.object({
  rfidTag: z.string().min(1, 'RFID tag is required').trim(),
  gate: z.string().optional(),
});

export const manualStudentGateEventSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  eventType: z.enum(['ENTRY', 'EXIT'], { required_error: 'Event type (ENTRY/EXIT) is required' }),
  gate: z.string().optional(),
  notes: z.string().optional(),
});

export const unknownStudentSchema = z.object({
  name: z.string().optional(),
  approximateClass: z.string().optional(),
  notes: z.string().min(1, 'Notes/description are required for unknown student entry'),
  eventType: z.enum(['ENTRY', 'EXIT']).default('ENTRY'),
  gate: z.string().optional(),
});

export const visitorEntrySchema = z.object({
  name: z.string().min(1, 'Visitor name is required').trim(),
  phone: z.string().optional(),
  purpose: z.string().min(1, 'Purpose of visit is required').trim(),
  visitingPersonOrDept: z.string().optional(),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  gate: z.string().optional(),
});

export const visitorExitSchema = z.object({
  notes: z.string().optional(),
  gate: z.string().optional(),
});

export const createVehicleSchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle registration number is required').trim(),
  type: z.enum(['van', 'bus', 'car', 'other']).default('van'),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleGateEventSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  eventType: z.enum(['ENTRY', 'EXIT'], { required_error: 'Event type (ENTRY/EXIT) is required' }),
  gate: z.string().optional(),
  notes: z.string().optional(),
});
