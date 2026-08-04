import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
}, { timestamps: true });

academicYearSchema.index({ schoolId: 1, isCurrent: 1 });
academicYearSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export default mongoose.model('AcademicYear', academicYearSchema);
