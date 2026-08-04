import ParentMeeting from '../models/ParentMeeting.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createMeeting = async (schoolId, data, userId) => {
  const meeting = await ParentMeeting.create({ ...data, schoolId, createdBy: userId });
  return meeting;
};

export const getMeetings = async (schoolId, options) => {
  return paginate(ParentMeeting, { schoolId }, options);
};

export const getMeetingById = async (id, schoolId) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId })
    .populate('teacher', 'firstName lastName')
    .populate('invitedParents', 'firstName lastName contact')
    .populate('attendedParents', 'firstName lastName');
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  return meeting;
};

export const updateMeeting = async (id, schoolId, data) => {
  const meeting = await ParentMeeting.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  return meeting;
};

export const markAttendance = async (id, schoolId, parentId) => {
  const meeting = await ParentMeeting.findOne({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  if (!meeting.attendedParents.includes(parentId)) {
    meeting.attendedParents.push(parentId);
    await meeting.save();
  }
  return meeting;
};

export const deleteMeeting = async (id, schoolId) => {
  const meeting = await ParentMeeting.findOneAndDelete({ _id: id, schoolId });
  if (!meeting) throw new ApiError(404, 'Meeting not found');
  return true;
};
