import mongoose from 'mongoose';

const feeCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['admission', 'tuition', 'transport', 'library', 'sports', 'lab', 'development', 'other'], required: true },
  amount: { type: Number, required: true },
  isOptional: { type: Boolean, default: false },
  dueDate: Date,
  frequency: { type: String, enum: ['one_time', 'monthly', 'quarterly', 'half_yearly', 'annual'], default: 'monthly' },
}, { _id: false });

const feeStructureSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  schoolClass: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SchoolClass' }],
  categories: [feeCategorySchema],
  totalAmount: { type: Number, required: true },
  lateFeePerDay: { type: Number, default: 0 },
  discountRules: [{ name: String, type: String, value: Number }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

feeStructureSchema.index({ schoolId: 1, academicYear: 1 });

export default mongoose.model('FeeStructure', feeStructureSchema);
