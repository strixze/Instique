import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
  gradingScale: [{ grade: String, minPercent: Number, maxPercent: Number, points: Number }],
  feeSettings: { dueDayOfMonth: Number, lateFeeEnabled: Boolean, lateFeePerDay: Number, paymentMethods: [String] },
  notificationToggles: { attendance: Boolean, homework: Boolean, fee: Boolean, exam: Boolean, events: Boolean, general: Boolean },
  academicSettings: { maxSubjectsPerTeacher: Number, maxPeriodsPerDay: Number, workingDays: [Number] },
  recognitionSettings: { pointValues: [{ category: String, points: Number }] },
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);
