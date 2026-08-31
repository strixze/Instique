import { Router } from 'express';
import multer from 'multer';
import { downloadTemplate, importData } from '../controllers/bulkImport.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import ApiError from '../utils/ApiError.js';

const router = Router();

// Multer config — memory storage, 5MB limit, xlsx/csv only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];
    const allowedExts = ['.xlsx', '.xls', '.csv'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only Excel (.xlsx) and CSV (.csv) files are allowed'));
    }
  },
});

router.use(authMiddleware, tenantMiddleware);

// Download template — GET /api/v1/bulk-import/template/:type
router.get('/template/:type', requireRole('school_admin'), downloadTemplate);

// Import data — POST /api/v1/bulk-import/:type
router.post('/:type', requireRole('school_admin'), upload.single('file'), importData);

export default router;
