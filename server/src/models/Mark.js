import mongoose from 'mongoose';

const markSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  marksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  passMarks: { type: Number },
  grade: { type: String },
  percentage: { type: Number },
  remarks: String,
  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

markSchema.index({ schoolId: 1, exam: 1, subject: 1, student: 1 }, { unique: true });
markSchema.index({ schoolId: 1, student: 1 });

export default mongoose.model('Mark', markSchema);
