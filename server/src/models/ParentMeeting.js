import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  response: { type: String, enum: ['going', 'not_going', 'maybe'], required: true },
  respondedAt: { type: Date, default: Date.now },
}, { _id: true });

const attendanceSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['pending', 'attended', 'absent', 'cancelled'], default: 'pending' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  markedAt: Date,
}, { _id: true });

const noteSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  academicNotes: { type: String, default: '' },
  behaviourNotes: { type: String, default: '' },
  improvementNotes: { type: String, default: '' },
  actionItems: { type: String, default: '' },
  note: { type: String, default: '' },
  visibility: { type: String, enum: ['internal', 'parent_visible'], default: 'parent_visible' },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const parentMeetingSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['ptm', 'academic_review', 'progress_discussion', 'behaviour_discussion', 'general', 'other'],
    default: 'ptm',
  },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, default: '' },
  instructions: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'cancelled'],
    default: 'draft',
  },
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' }],
  targetSections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  assignedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  invitedParents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  rsvps: [rsvpSchema],
  attendance: [attendanceSchema],
  notes: [noteSchema],
  calendarEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent' },
  publishedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

parentMeetingSchema.index({ schoolId: 1, date: 1 });
parentMeetingSchema.index({ schoolId: 1, status: 1 });
parentMeetingSchema.index({ schoolId: 1, targetClasses: 1 });
parentMeetingSchema.index({ schoolId: 1, assignedTeachers: 1 });
parentMeetingSchema.index({ schoolId: 1, invitedParents: 1 });

export default mongoose.model('ParentMeeting', parentMeetingSchema);

