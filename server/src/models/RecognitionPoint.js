import mongoose from 'mongoose';

const recognitionPointSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  points: { type: Number, required: true },
  category: { type: String, enum: ['academic', 'behavior', 'participation', 'sports', 'leadership', 'other'], default: 'academic' },
  note: String,
}, { timestamps: true });

recognitionPointSchema.index({ schoolId: 1, student: 1 });
recognitionPointSchema.index({ schoolId: 1, awardedBy: 1 });

export default mongoose.model('RecognitionPoint', recognitionPointSchema);
