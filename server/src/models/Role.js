import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  description: String,
  permissions: { type: Map, of: [String], default: {} },
  isSystem: { type: Boolean, default: false },
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

roleSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export default mongoose.model('Role', roleSchema);
