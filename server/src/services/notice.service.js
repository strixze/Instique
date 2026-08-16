import Notice from '../models/Notice.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createNotice = async (schoolId, data, userId) => {
  const notice = await Notice.create({ 
    ...data, 
    schoolId, 
    createdBy: userId,
  });
  return notice;
};

export const getNotices = async (schoolId, options) => {
  const query = { schoolId };

  if (options.filter && options.filter.tab) {
    const tab = options.filter.tab;
    const now = new Date();

    if (tab === 'active') {
      query.$or = [
        { 'schedule.expireAt': null },
        { 'schedule.expireAt': { $gt: now } }
      ];
    } else if (tab === 'history') {
      query['schedule.expireAt'] = { $lt: now };
    }
    delete options.filter.tab;
  }

  return paginate(Notice, query, { ...options, searchFields: ['title'] });
};

export const getNoticeById = async (id, schoolId) => {
  const notice = await Notice.findOne({ _id: id, schoolId });
  if (!notice) throw new ApiError(404, 'Notice not found');
  return notice;
};

export const updateNotice = async (id, schoolId, data) => {
  const notice = await Notice.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!notice) throw new ApiError(404, 'Notice not found');
  return notice;
};

export const deleteNotice = async (id, schoolId) => {
  const notice = await Notice.findOneAndDelete({ _id: id, schoolId });
  if (!notice) throw new ApiError(404, 'Notice not found');
  return true;
};
