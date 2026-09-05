import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  order: { type: Number, default: 0 },
  estimatedPeriods: { type: Number, default: 1 },
  learningObjectives: String,
}, { _id: true });

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  order: { type: Number, default: 0 },
  estimatedPeriods: { type: Number, default: 1 },
  topics: [topicSchema],
}, { _id: true });

const syllabusSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, trim: true },
  description: String,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  version: { type: Number, default: 1 },
  chapters: [chapterSchema],
  totalTopicsCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

syllabusSchema.index({ schoolId: 1, subject: 1, schoolClass: 1, academicYear: 1, version: 1 }, { unique: true });
syllabusSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('Syllabus', syllabusSchema);
