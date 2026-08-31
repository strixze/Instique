import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  type: { type: String, enum: ['student', 'parent'], required: true },
  complainant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  complainantName: String,
  isAnonymous: { type: Boolean, default: false },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

complaintSchema.index({ schoolId: 1, status: 1 });
complaintSchema.index({ schoolId: 1, type: 1 });

export default mongoose.model('Complaint', complaintSchema);
