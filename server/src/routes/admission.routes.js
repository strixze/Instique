import { Router } from 'express';
import { 
  createAdmission, 
  getAdmissions, 
  getAdmissionStats,
  getAdmissionById, 
  updateAdmissionStatus, 
  uploadDocuments,
  updateDocumentStatus,
  allocateClassSection,
  assignFeeStructure,
  recordManualPayment,
  confirmAdmission
} from '../controllers/admission.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import upload from '../middlewares/upload.middleware.js';
import { 
  createAdmissionSchema, 
  updateAdmissionStatusSchema,
  updateDocumentStatusSchema,
  allocateClassSectionSchema,
  assignFeeStructureSchema,
  recordManualPaymentSchema
} from '../validators/admission.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/stats', requireRole('school_admin'), getAdmissionStats);
router.get('/', requireRole('school_admin'), getAdmissions);
router.get('/:id', requireRole('school_admin'), getAdmissionById);
router.post('/', requireRole('school_admin'), validate(createAdmissionSchema), createAdmission);
router.put('/:id/status', requireRole('school_admin'), validate(updateAdmissionStatusSchema), updateAdmissionStatus);
router.post('/:id/documents', requireRole('school_admin'), upload.array('documents'), uploadDocuments);

// New admission workflow steps
router.put('/:id/documents/:documentId/status', requireRole('school_admin'), validate(updateDocumentStatusSchema), updateDocumentStatus);
router.put('/:id/allocate-class', requireRole('school_admin'), validate(allocateClassSectionSchema), allocateClassSection);
router.put('/:id/assign-fee', requireRole('school_admin'), validate(assignFeeStructureSchema), assignFeeStructure);
router.put('/:id/record-payment', requireRole('school_admin'), validate(recordManualPaymentSchema), recordManualPayment);
router.put('/:id/confirm', requireRole('school_admin'), confirmAdmission);

export default router;
