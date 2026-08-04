import { Router } from 'express';
import { createFeeStructure, getFeeStructures, getFeeStructureById, updateFeeStructure, deleteFeeStructure, recordPayment, getFeeTransactions, getStudentFeeStatus, getFeeReport } from '../controllers/fee.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createFeeStructureSchema, recordPaymentSchema } from '../validators/fee.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/report', requireRole('school_admin'), getFeeReport);
router.get('/structures', requireRole('school_admin'), getFeeStructures);
router.get('/structures/:id', requireRole('school_admin'), getFeeStructureById);
router.post('/structures', requireRole('school_admin'), validate(createFeeStructureSchema), createFeeStructure);
router.put('/structures/:id', requireRole('school_admin'), updateFeeStructure);
router.delete('/structures/:id', requireRole('school_admin'), deleteFeeStructure);

router.get('/transactions', requireRole('school_admin'), getFeeTransactions);
router.post('/payments', requireRole('school_admin'), validate(recordPaymentSchema), recordPayment);
router.get('/student/:studentId', requireRole('school_admin', 'parent', 'student'), getStudentFeeStatus);

export default router;
