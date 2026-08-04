import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  address: { street: String, city: String, state: String, zip: String, country: { type: String, default: 'India' } },
  contact: { phone: String, email: String, website: String },
  branding: { logo: String, primaryColor: { type: String, default: '#1e40af' }, secondaryColor: { type: String, default: '#1e3a5f' } },
  academicSession: { startDate: Date, endDate: Date, currentAcademicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' } },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
}, { timestamps: true });

schoolSchema.index({ code: 1 });
schoolSchema.index({ status: 1 });

export default mongoose.model('School', schoolSchema);
