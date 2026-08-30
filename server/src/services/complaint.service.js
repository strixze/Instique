import Complaint from '../models/Complaint.js';
import { User } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createComplaint = async (schoolId, data, userId, userRole) => {
  let complainantName = data.isAnonymous ? 'Anonymous' : undefined;
  if (!data.isAnonymous && userId) {
    const u = await User.findById(userId);
    if (u) complainantName = u.name;
  }

  const complaint = await Complaint.create({
    ...data,
    schoolId,
    type: data.type || (userRole === 'parent' ? 'parent' : 'student'),
    complainant: data.isAnonymous ? undefined : userId,
    complainantName,
  });
  return complaint;
};

export const getComplaints = async (schoolId, options, user) => {
  const query = { schoolId };
  if (user && (user.role === 'parent' || user.role === 'student')) {
    query.complainant = user._id;
  }
  return paginate(Complaint, query, {
    ...options,
    searchFields: ['subject', 'description'],
    populate: [{ path: 'complainant', select: 'name email role' }],
  });
};

export const getComplaintById = async (id, schoolId, user) => {
  const query = { _id: id, schoolId };
  if (user && (user.role === 'parent' || user.role === 'student')) {
    query.complainant = user._id;
  }
  const complaint = await Complaint.findOne(query).populate('complainant', 'name email role');
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

