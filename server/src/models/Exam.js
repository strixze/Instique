import mongoose from 'mongoose';

const examSubjectSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  maxMarks: { type: Number, required: true },
  passMarks: { type: Number, required: true },
  date: Date,
  startTime: String,
  endTime: String,
}, { _id: false });

const examSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  subjects: [examSubjectSchema],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  type: { type: String, enum: ['midterm', 'final', 'quarterly', 'half_yearly', 'weekly', 'unit_test'], default: 'unit_test' },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'published'], default: 'upcoming' },
  gradingScale: { type: mongoose.Schema.Types.ObjectId, ref: 'Setting' },
}, { timestamps: true });

examSchema.index({ schoolId: 1, academicYear: 1, schoolClass: 1 });
examSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('Exam', examSchema);
