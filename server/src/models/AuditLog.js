import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: mongoose.Schema.Types.ObjectId,
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  ip: String,
  userAgent: String,
}, { timestamps: true });

auditLogSchema.index({ schoolId: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
