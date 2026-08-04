import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  applicantName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  applyingForClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' },
  parentName: String,
  parentPhone: { type: String, required: true },
  parentEmail: String,
  address: String,
  documents: [{ name: String, type: String, url: String, status: { type: String, enum: ['uploaded', 'pending', 'verified', 'rejected'], default: 'pending' } }],
  workflowStatus: {
    type: String,
    enum: ['submitted', 'document_upload', 'verification', 'approved', 'rejected', 'fee_paid', 'enrolled'],
    default: 'submitted',
  },
  remarks: String,
  applicationNo: { type: String, required: true, unique: true },
}, { timestamps: true });

admissionSchema.index({ schoolId: 1, workflowStatus: 1 });
admissionSchema.index({ applicationNo: 1 });

export default mongoose.model('Admission', admissionSchema);
