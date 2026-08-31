import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  relation: { type: String, enum: ['father', 'mother', 'guardian', 'other'] },
  contact: { phone: { type: String, required: true }, email: String, address: String },
  occupation: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  isPrimary: { type: Boolean, default: true },
}, { timestamps: true });

parentSchema.index({ schoolId: 1 });
parentSchema.index({ 'contact.phone': 1 });

export default mongoose.model('Parent', parentSchema);
