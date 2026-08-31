import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  date: { type: Date, required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  period: { type: Number },
  students: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, status: { type: String, enum: ['present', 'absent', 'late', 'holiday', 'leave'], required: true } }],
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['manual', 'bulk', 'offline-sync'], default: 'manual' },
  summary: { present: Number, absent: Number, late: Number, leave: Number, total: Number },
}, { timestamps: true });

attendanceSchema.index({ schoolId: 1, date: 1, schoolClass: 1 });
attendanceSchema.index({ schoolId: 1, date: 1, subject: 1 });

export default mongoose.model('Attendance', attendanceSchema);
