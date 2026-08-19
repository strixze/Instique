import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performerName: { type: String, default: 'System' },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
});

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  fileName: { type: String },
  mimeType: { type: String },
  public_id: { type: String },
});

const complaintSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  referenceNo: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['student', 'parent', 'teacher', 'admin'],
    default: 'student',
  },
  category: {
    type: String,
    enum: [
      'academic', 'teacher_staff', 'attendance', 'homework', 'examination',
      'fees', 'transport', 'infrastructure', 'safety', 'student_behaviour',
      'bullying', 'facilities', 'administration', 'other'
    ],
    default: 'other',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  complainant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  complainantName: { type: String, default: 'Anonymous' },
  complainantRole: { type: String, default: 'student' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String, default: '' },
  relatedClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' },
  relatedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAnonymous: { type: Boolean, default: false },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  attachments: [attachmentSchema],
  status: {
    type: String,
    enum: ['submitted', 'open', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'submitted',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: { type: String, default: '' },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activities: [activitySchema],
}, { timestamps: true });

complaintSchema.index({ schoolId: 1, referenceNo: 1 }, { unique: true });
complaintSchema.index({ schoolId: 1, status: 1 });
complaintSchema.index({ schoolId: 1, complainant: 1 });
complaintSchema.index({ schoolId: 1, category: 1 });

export default mongoose.model('Complaint', complaintSchema);
