import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
  plan: { type: String, enum: ['free_trial', 'basic', 'professional', 'enterprise'], default: 'free_trial' },
  status: { type: String, enum: ['active', 'trial', 'expired', 'cancelled', 'suspended'], default: 'trial' },
  trialStart: { type: Date },
  trialEnd: { type: Date },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  billingHistory: [{ period: String, amount: Number, paidAt: Date, transactionId: String, status: String }],
  usageLimits: { students: Number, teachers: Number, storage: Number },
  currentUsage: { students: { type: Number, default: 0 }, teachers: { type: Number, default: 0 }, storage: { type: Number, default: 0 } },
  autoRenew: { type: Boolean, default: true },
  cancelledAt: Date,
}, { timestamps: true });

subscriptionSchema.index({ schoolId: 1 });
subscriptionSchema.index({ status: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
