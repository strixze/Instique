import mongoose from 'mongoose';
import FeeStructure from '../models/FeeStructure.js';
import FeeTransaction from '../models/FeeTransaction.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createFeeStructure = async (schoolId, data) => {
  const total = data.categories.reduce((sum, c) => sum + c.amount, 0);
  const structure = await FeeStructure.create({ ...data, schoolId, totalAmount: total });
  return structure;
};

export const getFeeStructures = async (schoolId, options) => {
  return paginate(FeeStructure, { schoolId }, { ...options, searchFields: ['name'] });
};

export const getFeeStructureById = async (id, schoolId) => {
  const structure = await FeeStructure.findOne({ _id: id, schoolId });
  if (!structure) throw new ApiError(404, 'Fee structure not found');
  return structure;
};

export const updateFeeStructure = async (id, schoolId, data) => {
  if (data.categories) {
    data.totalAmount = data.categories.reduce((sum, c) => sum + c.amount, 0);
  }
  const structure = await FeeStructure.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!structure) throw new ApiError(404, 'Fee structure not found');
  return structure;
};

export const deleteFeeStructure = async (id, schoolId) => {
  const structure = await FeeStructure.findOneAndDelete({ _id: id, schoolId });
  if (!structure) throw new ApiError(404, 'Fee structure not found');
  return true;
};

export const recordPayment = async (schoolId, data, userId) => {
  const structure = await FeeStructure.findById(data.feeStructure);
  if (!structure) throw new ApiError(404, 'Fee structure not found');

  const balance = data.amount - data.paidAmount;
  const status = balance <= 0 ? 'paid' : 'partial';

  const feeTransaction = await FeeTransaction.create({
    ...data,
    schoolId,
    balance: Math.max(0, balance),
    status,
    paidBy: userId,
    dueDate: new Date(),
    paymentDate: new Date(),
  });

  return feeTransaction;
};

export const getFeeTransactions = async (schoolId, options) => {
  return paginate(FeeTransaction, { schoolId }, options);
};

export const getStudentFeeStatus = async (schoolId, studentId) => {
  const transactions = await FeeTransaction.find({ schoolId, student: studentId })
    .populate('feeStructure', 'name totalAmount');
  const totalDue = transactions.reduce((s, t) => s + t.amount, 0);
  const totalPaid = transactions.reduce((s, t) => s + t.paidAmount, 0);
  return { transactions, totalDue, totalPaid, balance: totalDue - totalPaid };
};

export const getFeeReport = async (schoolId) => {
  const totalCollected = await FeeTransaction.aggregate([
    { $match: { schoolId: mongoose.Types.ObjectId.createFromHexString(schoolId), status: { $in: ['paid', 'partial'] } } },
    { $group: { _id: null, total: { $sum: '$paidAmount' } } },
  ]);
  const pendingCount = await FeeTransaction.countDocuments({ schoolId, status: { $in: ['pending', 'overdue'] } });
  return {
    totalCollected: totalCollected[0]?.total || 0,
    pendingCount,
  };
};
