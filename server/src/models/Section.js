import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  schoolClass: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  strength: { type: Number, default: 0 },
  roomNo: String,
}, { timestamps: true });

sectionSchema.index({ schoolId: 1, schoolClass: 1, name: 1 }, { unique: true });

export default mongoose.model('Section', sectionSchema);
