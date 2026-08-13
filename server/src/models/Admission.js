import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  
  // Student Information
  firstName: { type: String, required: true, trim: true },
  middleName: { type: String, trim: true },
  lastName: { type: String, required: true, trim: true },
  applicantName: { type: String, required: true, trim: true }, // [firstName, middleName, lastName].join(' ')
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  bloodGroup: String,
  aadhaarId: String,
  
  // Address Information
  address: String,
  city: String,
  state: String,
  pincode: String,

  // Academic History
  previousSchool: String,
  previousClass: String,
  applyingForClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  academicSession: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },

  // Parent / Guardian Information
  father: {
    name: String,
    phone: String,
    email: String,
    occupation: String,
  },
  mother: {
    name: String,
    phone: String,
    email: String,
    occupation: String,
  },
  guardian: {
    name: String,
    relation: String,
    phone: String,
    email: String,
  },

  // Document Verification
  documents: [{
    name: { type: String, required: true },
    type: String,
    url: { type: String, required: true },
    status: { type: String, enum: ['uploaded', 'pending', 'verified', 'rejected'], default: 'uploaded' },
    rejectionReason: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Workflow Status
  workflowStatus: {
    type: String,
    enum: [
      'draft', 'submitted', 'document_verification', 'under_review', 
      'approved', 'rejected', 'class_allocated', 'fee_assigned', 
      'payment_pending', 'partially_paid', 'paid', 'admitted', 'student_created'
    ],
    default: 'submitted',
  },
  remarks: String,
  applicationNo: { type: String, required: true, unique: true },

  // Allocation & Fees
  assignedClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' },
  assignedSection: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
  feeDiscount: {
    name: String,
    value: { type: Number, default: 0 }, // Discount value
  },
  feeTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FeeTransaction' }],
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },

  // History & Audit Trail
  history: [{
    status: { type: String, required: true },
    remarks: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

admissionSchema.index({ schoolId: 1, workflowStatus: 1 });

export default mongoose.model('Admission', admissionSchema);
