import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  description: String,
  icon: String,
  criteria: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  category: { type: String, enum: ['star_student', 'homework_hero', 'perfect_attendance', 'helpful_student', 'custom'], default: 'custom' },
  isActive: { type: Boolean, default: true },
  awardedTo: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, awardedAt: Date }],
}, { timestamps: true });

badgeSchema.index({ schoolId: 1 });

export default mongoose.model('Badge', badgeSchema);
