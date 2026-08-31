import mongoose from 'mongoose';

const parentMeetingSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  type: {
    type: String,
    enum: [
      'parent_teacher_meeting',
      'academic_review',
      'progress_discussion',
      'behaviour_discussion',
      'general',
      'other',
    ],
    default: 'parent_teacher_meeting',
    required: true,
  },
  description: { type: String, trim: true, default: '' },
  date: { type: Date, required: true },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  location: { type: String, trim: true, default: '' },
  instructions: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT',
    required: true,
  },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publishedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledReason: { type: String, trim: true, default: '' },
}, { timestamps: true });

parentMeetingSchema.index({ schoolId: 1, date: 1 });
parentMeetingSchema.index({ schoolId: 1, status: 1 });
parentMeetingSchema.index({ schoolId: 1, type: 1 });

export default mongoose.model('ParentMeeting', parentMeetingSchema);