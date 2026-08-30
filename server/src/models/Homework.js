import mongoose from 'mongoose';

const homeworkAttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String },
  size: { type: Number },
  mimeType: { type: String },
}, { _id: false });

const homeworkSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  submittedAt: { type: Date, default: Date.now },
  content: { type: String },
  attachments: [homeworkAttachmentSchema],
  status: { type: String, enum: ['submitted', 'late', 'graded', 'resubmitted'], default: 'submitted' },
  marks: { type: Number },
  feedback: { type: String },
}, { _id: true, timestamps: true });

const homeworkSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  assignedDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'published' },
  attachments: [homeworkAttachmentSchema],
  isTemplate: { type: Boolean, default: false },
  submissions: [homeworkSubmissionSchema],
}, { timestamps: true });

homeworkSchema.index({ schoolId: 1, schoolClass: 1, section: 1, status: 1 });
homeworkSchema.index({ schoolId: 1, teacher: 1, status: 1 });
homeworkSchema.index({ schoolId: 1, subject: 1, dueDate: 1 });
homeworkSchema.index({ schoolId: 1, status: 1, dueDate: 1 });

export default mongoose.model('Homework', homeworkSchema);
