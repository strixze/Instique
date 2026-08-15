import { Router } from 'express';
import {
  createAcademicYear, getAcademicYears, updateAcademicYear, deleteAcademicYear,
  createClass, getClasses, getClassById, updateClass, deleteClass,
  createSection, getSections, getSectionsByClass, updateSection, deleteSection,
  createSubject, getSubjects, updateSubject, deleteSubject, bulkEditSubjects,
} from '../controllers/academic.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import tenantMiddleware from '../middlewares/tenant.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createAcademicYearSchema, createClassSchema, createSectionSchema, createSubjectSchema,
} from '../validators/academic.validator.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/academic-years', requireRole('school_admin'), validate(createAcademicYearSchema), createAcademicYear);
router.get('/academic-years', requireRole('school_admin', 'teacher'), getAcademicYears);
router.put('/academic-years/:id', requireRole('school_admin'), updateAcademicYear);
router.delete('/academic-years/:id', requireRole('school_admin'), deleteAcademicYear);

router.post('/classes', requireRole('school_admin'), validate(createClassSchema), createClass);
router.get('/classes', requireRole('school_admin', 'teacher'), getClasses);
router.get('/classes/:id', requireRole('school_admin', 'teacher'), getClassById);
router.put('/classes/:id', requireRole('school_admin'), updateClass);
router.delete('/classes/:id', requireRole('school_admin'), deleteClass);

router.post('/sections', requireRole('school_admin'), validate(createSectionSchema), createSection);
router.get('/sections', requireRole('school_admin', 'teacher'), getSections);
router.get('/sections/by-class/:classId', requireRole('school_admin', 'teacher'), getSectionsByClass);
router.put('/sections/:id', requireRole('school_admin'), updateSection);
router.delete('/sections/:id', requireRole('school_admin'), deleteSection);

router.post('/subjects', requireRole('school_admin'), validate(createSubjectSchema), createSubject);
router.get('/subjects', requireRole('school_admin', 'teacher'), getSubjects);
router.put('/subjects/bulk/edit', requireRole('school_admin'), bulkEditSubjects);
router.put('/subjects/:id', requireRole('school_admin'), updateSubject);
router.delete('/subjects/:id', requireRole('school_admin'), deleteSubject);

export default router;
