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
  classTeacherSection: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  weeklyTeachingLimit: { type: Number, default: 30 },
  dailyTeachingLimit: { type: Number, default: 6 },
  availableWorkingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
  unavailablePeriods: [{
    day: { type: Number, min: 0, max: 6 },
    periodNo: { type: Number, min: 1 },
    _id: false,
  }],
  preferredPeriods: [{
    day: { type: Number, min: 0, max: 6 },
    periodNo: { type: Number, min: 1 },
    _id: false,
  }],
  qualifications: [{ degree: String, institution: String, year: Number }],
  documents: [{ name: String, url: String, uploadedAt: Date }],
  status: { type: String, enum: ['active', 'inactive', 'left'], default: 'active' },
}, { timestamps: true });

teacherSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });
teacherSchema.index({ schoolId: 1, department: 1 });

export default mongoose.model('Teacher', teacherSchema);
