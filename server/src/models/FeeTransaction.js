import mongoose from 'mongoose';

const feeTransactionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  discount: { name: String, amount: Number },
  lateFee: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  dueDate: Date,
  paymentDate: { type: Date },
  status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'cheque', 'online', 'bank_transfer'] },
  transactionId: { type: String },
  receiptNo: { type: String },
  remarks: String,
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

feeTransactionSchema.index({ schoolId: 1, student: 1, feeStructure: 1 });
feeTransactionSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('FeeTransaction', feeTransactionSchema);
