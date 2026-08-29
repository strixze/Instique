import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import env from '../config/env.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'school_admin', 'teacher', 'student', 'parent'], required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  profileId: { type: mongoose.Schema.Types.ObjectId },
  profileModel: { type: String, enum: ['Student', 'Teacher', 'Parent', null], default: null },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  refreshToken: { type: String },
  permissions: { type: Map, of: [String], default: {} },
  status: { type: String, enum: ['pending_activation', 'active', 'inactive', 'suspended'], default: 'active' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  passwordChangedAt: { type: Date },
  sessions: [{ token: String, device: String, ip: String, lastActivity: Date }],
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

userSchema.index({ email: 1 });
userSchema.index({ schoolId: 1, role: 1 });
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);
