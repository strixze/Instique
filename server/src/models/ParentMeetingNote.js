import mongoose from 'mongoose';

const parentMeetingNoteSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentMeeting', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  note: { type: String, required: true, trim: true },
  visibility: {
    type: String,
    enum: ['INTERNAL', 'PARENT_VISIBLE'],
    default: 'INTERNAL',
    required: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

parentMeetingNoteSchema.index({ schoolId: 1, meetingId: 1 });
parentMeetingNoteSchema.index({ schoolId: 1, meetingId: 1, student: 1 });

export default mongoose.model('ParentMeetingNote', parentMeetingNoteSchema);