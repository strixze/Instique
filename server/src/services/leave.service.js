import Leave from '../models/Leave.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createLeave = async (schoolId, data, userId) => {
  const overlap = await Leave.findOne({
    schoolId,
    requester: userId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: new Date(data.endDate) }, endDate: { $gte: new Date(data.startDate) } },
    ],
  });

  if (overlap) throw new ApiError(409, 'Leave request overlaps with existing leave');

  const leave = await Leave.create({
    ...data,
    schoolId,
    requester: userId,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
  });

  return leave;
};

export const getLeaves = async (schoolId, options, user) => {
  const query = { schoolId };
  if (user && (user.role === 'parent' || user.role === 'student')) {
    query.requester = user._id;
  }
  return paginate(Leave, query, {
    ...options,
    populate: [
      { path: 'requester', select: 'name email role' },
      { path: 'substituteTeacher', select: 'firstName lastName' },
    ],
  });
};


export const getLeaveById = async (id, schoolId) => {
  const leave = await Leave.findOne({ _id: id, schoolId })
    .populate('requester', 'name email')
    .populate('approvedBy', 'name');
  if (!leave) throw new ApiError(404, 'Leave not found');
  return leave;
};

export const processLeave = async (id, schoolId, data, userId) => {
  const leave = await Leave.findOne({ _id: id, schoolId });
  if (!leave) throw new ApiError(404, 'Leave not found');
  if (leave.status !== 'pending') throw new ApiError(400, 'Leave already processed');

  leave.status = data.status;
  leave.approvedBy = userId;
  if (data.rejectionReason) leave.rejectionReason = data.rejectionReason;
  if (data.substituteTeacher) leave.substituteTeacher = data.substituteTeacher;
  await leave.save();

  return leave;
};

export const getMyLeaves = async (userId, options) => {
  return paginate(Leave, { requester: userId }, options);
};
