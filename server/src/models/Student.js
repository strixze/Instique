import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  admissionNo: { type: String, required: true, trim: true },
  currentClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' },
  currentSection: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  contact: { phone: String, email: String, address: String },
  emergencyContacts: [{ name: String, relation: String, phone: String }],
  documents: [{ name: String, type: String, url: String, uploadedAt: Date }],
  status: { type: String, enum: ['active', 'promoted', 'transferred', 'archived'], default: 'active' },
  statusHistory: [{ from: String, to: String, date: Date, reason: String }],
}, { timestamps: true });

studentSchema.index({ schoolId: 1, admissionNo: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, currentClass: 1 });
studentSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('Student', studentSchema);
