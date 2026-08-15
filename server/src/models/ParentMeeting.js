import mongoose from 'mongoose';

const parentMeetingSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  invitedParents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  attendedParents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  location: String,
  notes: String,
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

parentMeetingSchema.index({ schoolId: 1, date: 1 });
parentMeetingSchema.index({ schoolId: 1, teacher: 1 });

export default mongoose.model('ParentMeeting', parentMeetingSchema);
