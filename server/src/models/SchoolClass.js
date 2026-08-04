import mongoose from 'mongoose';

const schoolClassSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  order: { type: Number, default: 0 },
}, { timestamps: true });

schoolClassSchema.index({ schoolId: 1, name: 1, academicYear: 1 }, { unique: true });
schoolClassSchema.index({ schoolId: 1, academicYear: 1 });

export default mongoose.model('SchoolClass', schoolClassSchema);
