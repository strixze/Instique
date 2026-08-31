import mongoose from 'mongoose';

const accountTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['activation', 'password_reset'], default: 'activation', required: true },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date, default: null },
  emailDeliveryStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  emailDeliveryError: { type: String },
}, { timestamps: true });

accountTokenSchema.index({ tokenHash: 1, type: 1 });
accountTokenSchema.index({ userId: 1, type: 1 });
accountTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto cleanup expired after expiry

export default mongoose.model('AccountToken', accountTokenSchema);
