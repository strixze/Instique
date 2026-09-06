import mongoose from 'mongoose';

const topicProgressSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'skipped'],
    default: 'not_started'
  },
  startedAt: Date,
  completedAt: Date,
  notes: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const sectionSyllabusTrackSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  syllabus: { type: mongoose.Schema.Types.ObjectId, ref: 'Syllabus', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'archived'],
    default: 'not_started'
  },
  topicProgress: [topicProgressSchema],
  overallCompletion: { type: Number, default: 0, min: 0, max: 100 },
  completedTopicsCount: { type: Number, default: 0 },
  totalTopicsCount: { type: Number, default: 0 },
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

sectionSyllabusTrackSchema.index({ schoolId: 1, syllabus: 1, section: 1 }, { unique: true });
sectionSyllabusTrackSchema.index({ schoolId: 1, schoolClass: 1, section: 1, subject: 1 });
sectionSyllabusTrackSchema.index({ schoolId: 1, assignedTeacher: 1 });

export default mongoose.model('SectionSyllabusTrack', sectionSyllabusTrackSchema);
