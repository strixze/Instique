import { 
  createAdmission, 
  updateDocumentStatus, 
  updateAdmissionStatus, 
  allocateClassSection, 
  assignFeeStructure, 
  recordManualPayment, 
  confirmAdmission 
} from '../admission.service.js';
import Admission from '../../models/Admission.js';
import Student from '../../models/Student.js';
import Parent from '../../models/Parent.js';
import Section from '../../models/Section.js';
import SchoolClass from '../../models/SchoolClass.js';
import FeeStructure from '../../models/FeeStructure.js';
import FeeTransaction from '../../models/FeeTransaction.js';
import AcademicYear from '../../models/AcademicYear.js';

describe('Admission Service MVP Flow Unit Tests', () => {
  let originalAcademicYearFindById;
  let originalAdmissionCount;
  let originalAdmissionCreate;
  let originalAdmissionFindOne;
  let originalStudentCount;
  let originalStudentCreate;
  let originalParentFindOne;
  let originalParentCreate;
  let originalSectionFindOne;
  let originalSchoolClassFindOne;
  let originalFeeStructureFindOne;
  let originalFeeTransactionCreate;
  let originalFeeTransactionUpdateMany;

  beforeAll(() => {
    originalAcademicYearFindById = AcademicYear.findById;
    originalAdmissionCount = Admission.countDocuments;
    originalAdmissionCreate = Admission.create;
    originalAdmissionFindOne = Admission.findOne;
    originalStudentCount = Student.countDocuments;
    originalStudentCreate = Student.create;
    originalParentFindOne = Parent.findOne;
    originalParentCreate = Parent.create;
    originalSectionFindOne = Section.findOne;
    originalSchoolClassFindOne = SchoolClass.findOne;
    originalFeeStructureFindOne = FeeStructure.findOne;
    originalFeeTransactionCreate = FeeTransaction.create;
    originalFeeTransactionUpdateMany = FeeTransaction.updateMany;
  });

  afterAll(() => {
    AcademicYear.findById = originalAcademicYearFindById;
    Admission.countDocuments = originalAdmissionCount;
    Admission.create = originalAdmissionCreate;
    Admission.findOne = originalAdmissionFindOne;
    Student.countDocuments = originalStudentCount;
    Student.create = originalStudentCreate;
    Parent.findOne = originalParentFindOne;
    Parent.create = originalParentCreate;
    Section.findOne = originalSectionFindOne;
    SchoolClass.findOne = originalSchoolClassFindOne;
    FeeStructure.findOne = originalFeeStructureFindOne;
    FeeTransaction.create = originalFeeTransactionCreate;
    FeeTransaction.updateMany = originalFeeTransactionUpdateMany;
  });

  test('createAdmission should generate correct ADM-YYYY-XXXXX format', async () => {
    AcademicYear.findById = async () => ({ _id: 'year-123', name: '2026-2027' });
    Admission.countDocuments = async () => 41; // count is 41, next is 42
    let createdData = null;
    Admission.create = async (data) => {
      createdData = data;
      return { ...data, _id: 'adm-42' };
    };

    const schoolId = 'school-1';
    const postData = {
      firstName: 'Aarav',
      lastName: 'Patil',
      gender: 'male',
      dateOfBirth: new Date(),
      academicSession: 'year-123',
      applyingForClass: 'class-9',
      parentPhone: '9000000000'
    };

    const admission = await createAdmission(schoolId, postData, 'user-99');

    expect(admission.applicationNo).toBe('ADM-2026-00042');
    expect(admission.applicantName).toBe('Aarav Patil');
    expect(admission.workflowStatus).toBe('submitted');
    expect(admission.history[0].status).toBe('submitted');
  });

  test('updateDocumentStatus should verify or reject individual documents', async () => {
    const mockDoc = {
      _id: 'doc-1',
      name: 'Birth Certificate',
      status: 'uploaded',
      url: '/file.jpg'
    };

    const mockAdmission = {
      _id: 'adm-42',
      workflowStatus: 'submitted',
      documents: {
        id: (id) => id === 'doc-1' ? mockDoc : null,
      },
      history: [],
      save: async function() { return this; }
    };

    Admission.findOne = async () => mockAdmission;

    const result = await updateDocumentStatus('adm-42', 'school-1', 'doc-1', {
      status: 'verified'
    }, 'admin-1');

    expect(mockDoc.status).toBe('verified');
    expect(mockDoc.verifiedBy).toBe('admin-1');
    expect(result.history[0].remarks).toContain('Birth Certificate');
  });

  test('updateAdmissionStatus to approved should require all documents verified', async () => {
    const mockAdmission = {
      _id: 'adm-42',
      workflowStatus: 'submitted',
      documents: [
        { name: 'Birth Certificate', status: 'verified' },
        { name: 'Aadhaar', status: 'pending' } // not verified!
      ],
      history: [],
      save: async function() { return this; }
    };

    Admission.findOne = async () => mockAdmission;

    await expect(
      updateAdmissionStatus('adm-42', 'school-1', 'approved', 'Approved remarks', 'admin-1')
    ).rejects.toThrow('Cannot approve application: All uploaded documents must be verified first.');
  });

  test('allocateClassSection should fail if section is full', async () => {
    const mockAdmission = {
      _id: 'adm-42',
      workflowStatus: 'approved',
      history: [],
      save: async function() { return this; }
    };

    Admission.findOne = async () => mockAdmission;
    SchoolClass.findOne = async () => ({ _id: 'class-1', name: 'Class 7' });
    Section.findOne = async () => ({ _id: 'sec-1', name: 'A', strength: 40 }); // capacity 40
    Student.countDocuments = async () => 40; // currently 40 students

    await expect(
      allocateClassSection('adm-42', 'school-1', { assignedClassId: 'class-1', assignedSectionId: 'sec-1' }, 'admin-1')
    ).rejects.toThrow('Section "A" is full');
  });
});
