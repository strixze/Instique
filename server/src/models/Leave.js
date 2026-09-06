import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterModel: { type: String, enum: ['Student', 'Teacher', 'Parent'], required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  approverTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  type: { type: String, enum: ['sick', 'casual', 'personal', 'emergency', 'earned', 'vacation', 'other'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isPartialDay: { type: Boolean, default: false },
  startTime: { type: String }, // e.g. "10:00"
  endTime: { type: String },   // e.g. "14:00"
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectionReason: String,
  substituteTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  substituteSuggested: [{ teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, score: Number }],
  substitutionsCount: { type: Number, default: 0 },
  substitutionsAssignedCount: { type: Number, default: 0 },
  document: { name: String, url: String },
  auditTrail: [{
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: String,
  }],
}, { timestamps: true });

leaveSchema.index({ schoolId: 1, requester: 1 });
leaveSchema.index({ schoolId: 1, status: 1 });
leaveSchema.index({ schoolId: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ schoolId: 1, student: 1 });
leaveSchema.index({ schoolId: 1, approverTeacher: 1, status: 1 });
leaveSchema.index({ schoolId: 1, student: 1, startDate: 1, endDate: 1 });

export default mongoose.model('Leave', leaveSchema);
