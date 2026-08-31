import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['general', 'academic', 'event', 'emergency', 'holiday', 'circular'], default: 'general' },
  scope: { type: String, enum: ['school', 'class', 'teacher', 'student'], default: 'school' },
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' }],
  targetSections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  attachments: [{ name: String, url: String }],
  isTemplate: { type: Boolean, default: false },
  schedule: { publishAt: Date, expireAt: Date },
  isPinned: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
}, { timestamps: true });

noticeSchema.index({ schoolId: 1, status: 1, scope: 1 });
noticeSchema.index({ schoolId: 1, category: 1 });

export default mongoose.model('Notice', noticeSchema);
