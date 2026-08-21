import mongoose from 'mongoose';

const parentMeetingTeacherSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentMeeting', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
}, { timestamps: true });

parentMeetingTeacherSchema.index({ schoolId: 1, meetingId: 1 });
parentMeetingTeacherSchema.index({ schoolId: 1, teacher: 1 });

export default mongoose.model('ParentMeetingTeacher', parentMeetingTeacherSchema);