import { Router } from 'express';
import { createAdmission, getAdmissions, getAdmissionById, updateAdmissionStatus, uploadDocuments } from '../controllers/admission.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import upload from '../middlewares/upload.middleware.js';
import { createAdmissionSchema, updateAdmissionStatusSchema } from '../validators/admission.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requireRole('school_admin'), getAdmissions);
router.get('/:id', requireRole('school_admin'), getAdmissionById);
router.post('/', requireRole('school_admin'), validate(createAdmissionSchema), createAdmission);
router.put('/:id/status', requireRole('school_admin'), validate(updateAdmissionStatusSchema), updateAdmissionStatus);
router.post('/:id/documents', requireRole('school_admin'), upload.array('documents'), uploadDocuments);

export default router;
