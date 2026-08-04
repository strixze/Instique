import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  employeeId: { type: String, required: true, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  contact: { phone: String, email: String, address: String },
  department: { type: String, trim: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' }],
  assignedSections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  isClassTeacher: { type: Boolean, default: false },
  classTeacherOf: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' },
  qualifications: [{ degree: String, institution: String, year: Number }],
  documents: [{ name: String, url: String, uploadedAt: Date }],
  status: { type: String, enum: ['active', 'inactive', 'left'], default: 'active' },
}, { timestamps: true });

teacherSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });
teacherSchema.index({ schoolId: 1, department: 1 });

export default mongoose.model('Teacher', teacherSchema);
