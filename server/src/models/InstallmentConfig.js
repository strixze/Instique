import mongoose from 'mongoose';

const installmentConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percentages: [{ type: Number, required: true }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('InstallmentConfig', installmentConfigSchema);
