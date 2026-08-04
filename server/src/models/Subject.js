import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  type: { type: String, enum: ['core', 'elective', 'co-curricular'], default: 'core' },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' }],
  weeklyPeriods: { type: Number, default: 5 },
  maxPeriodsPerDay: { type: Number, default: 2 },
  isPractical: { type: Boolean, default: false },
  requiresConsecutive: { type: Boolean, default: false },
  consecutivePeriods: { type: Number, default: 2, min: 2, max: 3 },
  category: { type: String, enum: ['academic', 'sports', 'arts', 'activity'], default: 'academic' },
  labRequired: { type: String, trim: true },
  preferredPeriods: [{
    day: { type: Number, min: 0, max: 6 },
    periodNo: { type: Number, min: 1 },
    _id: false,
  }],
  maxMarks: { type: Number, default: 100 },
  passMarks: { type: Number, default: 33 },
}, { timestamps: true });

subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });
subjectSchema.index({ schoolId: 1, name: 1 });

export default mongoose.model('Subject', subjectSchema);
