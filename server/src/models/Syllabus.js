import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,
  order: { type: Number, default: 0 },
  totalClasses: { type: Number, default: 1 },
  completedClasses: { type: Number, default: 0 },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
}, { _id: false });

const syllabusSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  chapters: [chapterSchema],
  totalCompletion: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
}, { timestamps: true });

syllabusSchema.index({ schoolId: 1, subject: 1, schoolClass: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('Syllabus', syllabusSchema);
