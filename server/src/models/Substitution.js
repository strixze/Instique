import mongoose from 'mongoose';

const substitutionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  leaveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Leave', required: true },
  timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
  
  date: { type: Date, required: true },
  day: { type: Number, required: true, min: 0, max: 6 },
  periodNo: { type: Number, required: true, min: 1 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  room: { type: String, trim: true },
  
  originalTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  substituteTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  
  status: {
    type: String,
    enum: ['pending', 'assigned', 'cancelled', 'completed'],
    default: 'pending',
  },
  
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: Date,
  notes: { type: String, trim: true },
}, { timestamps: true });

substitutionSchema.index({ schoolId: 1, date: 1 });
substitutionSchema.index({ schoolId: 1, leaveId: 1 });
substitutionSchema.index({ schoolId: 1, originalTeacher: 1, date: 1 });
substitutionSchema.index({ schoolId: 1, substituteTeacher: 1, date: 1 });
substitutionSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('Substitution', substitutionSchema);
