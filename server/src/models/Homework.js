import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dueDate: { type: Date, required: true },
  attachments: [{ name: String, url: String }],
  isTemplate: { type: Boolean, default: false },
  submissions: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, submittedAt: Date, content: String, attachments: [{ name: String, url: String }], status: { type: String, enum: ['submitted', 'late', 'graded'], default: 'submitted' }, marks: Number }],
}, { timestamps: true });

homeworkSchema.index({ schoolId: 1, schoolClass: 1, dueDate: 1 });
homeworkSchema.index({ schoolId: 1, subject: 1 });

export default mongoose.model('Homework', homeworkSchema);
