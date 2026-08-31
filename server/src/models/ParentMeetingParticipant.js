import mongoose from 'mongoose';

const parentMeetingParticipantSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentMeeting', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  rsvpStatus: {
    type: String,
    enum: ['PENDING', 'GOING', 'NOT_GOING', 'MAYBE'],
    default: 'PENDING',
    required: true,
  },
  attendanceStatus: {
    type: String,
    enum: ['PENDING', 'ATTENDED', 'ABSENT', 'NOT_SCHEDULED'],
    default: 'PENDING',
    required: true,
  },
  invitedAt: { type: Date },
  respondedAt: { type: Date },
  attendedAt: { type: Date },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  markedAt: { type: Date },
}, { timestamps: true });

parentMeetingParticipantSchema.index({ schoolId: 1, meetingId: 1 });
parentMeetingParticipantSchema.index({ schoolId: 1, parent: 1, meetingId: 1 });
parentMeetingParticipantSchema.index({ schoolId: 1, student: 1, meetingId: 1 });

export default mongoose.model('ParentMeetingParticipant', parentMeetingParticipantSchema);