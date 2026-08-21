import mongoose from 'mongoose';

const parentMeetingClassSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentMeeting', required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
}, { timestamps: true });

parentMeetingClassSchema.index({ schoolId: 1, meetingId: 1 });
parentMeetingClassSchema.index({ schoolId: 1, schoolClass: 1 });

export default mongoose.model('ParentMeetingClass', parentMeetingClassSchema);