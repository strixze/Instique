import Complaint from '../models/Complaint.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createComplaint = async (schoolId, data, userId) => {
  const complaint = await Complaint.create({
    ...data,
    schoolId,
    complainant: data.isAnonymous ? undefined : userId,
    complainantName: data.isAnonymous ? 'Anonymous' : undefined,
  });
  return complaint;
};

export const getComplaints = async (schoolId, options) => {
  return paginate(Complaint, { schoolId }, { ...options, searchFields: ['subject'] });
};

export const getComplaintById = async (id, schoolId) => {
  const complaint = await Complaint.findOne({ _id: id, schoolId });
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  return complaint;
};

export const processComplaint = async (id, schoolId, data, userId) => {
  const complaint = await Complaint.findOneAndUpdate(
    { _id: id, schoolId },
    { ...data, resolvedBy: data.status === 'resolved' || data.status === 'closed' ? userId : undefined, resolvedAt: data.status === 'resolved' ? new Date() : undefined },
    { new: true }
  );
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  return complaint;
};
