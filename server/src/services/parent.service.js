import Parent from '../models/Parent.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createParent = async (schoolId, data) => {
  const parent = await Parent.create({ ...data, schoolId });
  return parent;
};

export const getParents = async (schoolId, options) => {
  return paginate(Parent, { schoolId }, { ...options, searchFields: ['firstName', 'lastName', 'contact.phone'] });
};

export const getParentById = async (id, schoolId) => {
  const parent = await Parent.findOne({ _id: id, schoolId }).populate('students', 'firstName lastName admissionNo currentClass');
  if (!parent) throw new ApiError(404, 'Parent not found');
  return parent;
};

export const updateParent = async (id, schoolId, data) => {
  const parent = await Parent.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!parent) throw new ApiError(404, 'Parent not found');
  return parent;
};
