import Role from '../models/Role.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createRole = async (schoolId, data) => {
  const existing = await Role.findOne({ schoolId, name: data.name });
  if (existing) throw new ApiError(409, 'Role already exists');
  const role = await Role.create({ ...data, schoolId });
  return role;
};

export const getRoles = async (schoolId, options) => {
  return paginate(Role, { schoolId }, options);
};

export const getRoleById = async (id, schoolId) => {
  const role = await Role.findOne({ _id: id, schoolId });
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};

export const updateRole = async (id, schoolId, data) => {
  const role = await Role.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};

export const deleteRole = async (id, schoolId) => {
  const role = await Role.findOneAndDelete({ _id: id, schoolId });
  if (!role) throw new ApiError(404, 'Role not found');
  return true;
};

export const assignRole = async (schoolId, userId, roleId) => {
  const role = await Role.findOne({ _id: roleId, schoolId });
  if (!role) throw new ApiError(404, 'Role not found');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.permissions = role.permissions;
  await user.save();

  if (!role.assignedUsers.includes(userId)) {
    role.assignedUsers.push(userId);
    await role.save();
  }

  return user;
};
