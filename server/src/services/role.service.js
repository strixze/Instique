import Role from '../models/Role.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

/**
 * Initialize default system roles if none exist for this school
 */
export const ensureDefaultRoles = async (schoolId) => {
  if (!schoolId) return;

  const count = await Role.countDocuments({ schoolId });
  if (count > 0) return;

  const defaultRoles = [
    {
      schoolId,
      name: 'Teacher',
      description: 'Standard classroom and subject instructor permissions',
      isSystem: true,
      permissions: {
        students: ['read'],
        teachers: ['read'],
        classes: ['read'],
        timetable: ['read'],
        attendance: ['read', 'create', 'update'],
        exams: ['read', 'create', 'update'],
        notices: ['read'],
        leaves: ['read', 'create'],
        complaints: ['read', 'create'],
      },
      assignedUsers: [],
    },
    {
      schoolId,
      name: 'Accountant',
      description: 'Fee collection, invoice processing, and financial reporting',
      isSystem: true,
      permissions: {
        students: ['read'],
        fees: ['read', 'create', 'update', 'delete'],
        notices: ['read'],
      },
      assignedUsers: [],
    },
    {
      schoolId,
      name: 'Academic Coordinator',
      description: 'Curriculum planning, syllabus oversight, and academic scheduling',
      isSystem: true,
      permissions: {
        students: ['read'],
        teachers: ['read'],
        classes: ['read', 'create', 'update'],
        timetable: ['read', 'create', 'update'],
        exams: ['read', 'create', 'update'],
        notices: ['read', 'create'],
      },
      assignedUsers: [],
    },
    {
      schoolId,
      name: 'Receptionist',
      description: 'Visitor logging, student admissions inquiry, and general announcements',
      isSystem: true,
      permissions: {
        admissions: ['read', 'create', 'update'],
        students: ['read'],
        notices: ['read'],
        complaints: ['read', 'create'],
      },
      assignedUsers: [],
    },
  ];

  try {
    await Role.insertMany(defaultRoles, { ordered: false });
  } catch {
    // Ignore duplicate key errors if already created concurrently
  }
};

/**
 * Get paginated list of roles
 */
export const getRoles = async (schoolId, options = {}) => {
  await ensureDefaultRoles(schoolId);

  const query = { schoolId };
  return paginate(Role, query, {
    ...options,
    searchFields: ['name', 'description'],
    sort: options.sort || '-isSystem name',
  });
};

/**
 * Get role by ID
 */
export const getRoleById = async (id, schoolId) => {
  const role = await Role.findOne({ _id: id, schoolId }).populate('assignedUsers', 'name email role');
  if (!role) throw new ApiError(404, 'Role not found');
  return role;
};

/**
 * Create a new custom role
 */
export const createRole = async (schoolId, data) => {
  const trimmedName = data.name.trim();
  const existing = await Role.findOne({
    schoolId,
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
  });

  if (existing) {
    throw new ApiError(409, `A role named "${trimmedName}" already exists`);
  }

  const role = await Role.create({
    schoolId,
    name: trimmedName,
    description: data.description?.trim() || '',
    permissions: data.permissions || {},
    isSystem: false,
    assignedUsers: [],
  });

  return role;
};

/**
 * Update an existing role
 */
export const updateRole = async (id, schoolId, data) => {
  const role = await Role.findOne({ _id: id, schoolId });
  if (!role) throw new ApiError(404, 'Role not found');

  if (data.name && data.name.trim() !== role.name) {
    if (role.isSystem) {
      throw new ApiError(400, 'System role names cannot be renamed');
    }
    const trimmedName = data.name.trim();
    const existing = await Role.findOne({
      schoolId,
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      throw new ApiError(409, `A role named "${trimmedName}" already exists`);
    }
    role.name = trimmedName;
  }

  if (data.description !== undefined) {
    role.description = data.description?.trim() || '';
  }

  if (data.permissions !== undefined) {
    if (typeof role.set === 'function') {
      role.set('permissions', data.permissions);
    } else {
      role.permissions = data.permissions;
    }
    if (typeof role.markModified === 'function') {
      role.markModified('permissions');
    }
  }

  await role.save();

  if (data.permissions !== undefined && role.assignedUsers?.length > 0) {
    await User.updateMany(
      { _id: { $in: role.assignedUsers }, schoolId },
      { $set: { permissions: data.permissions } }
    );
  }

  return role;
};

/**
 * Delete a role
 */
export const deleteRole = async (id, schoolId) => {
  const role = await Role.findOne({ _id: id, schoolId });
  if (!role) throw new ApiError(404, 'Role not found');

  if (role.isSystem) {
    throw new ApiError(400, 'System roles cannot be deleted');
  }

  if (role.assignedUsers && role.assignedUsers.length > 0) {
    throw new ApiError(
      400,
      `Cannot delete role with ${role.assignedUsers.length} assigned user(s). Please reassign them first.`
    );
  }

  await Role.deleteOne({ _id: id, schoolId });
  return true;
};

/**
 * Assign a role to a user
 */
export const assignRole = async (schoolId, userId, roleId) => {
  const role = await Role.findOne({ _id: roleId, schoolId });
  if (!role) throw new ApiError(404, 'Role not found');

  const user = await User.findOne({ _id: userId, schoolId });
  if (!user) throw new ApiError(404, 'User not found in this school');

  const alreadyAssigned = role.assignedUsers.some((uId) => uId.toString() === userId.toString());
  if (!alreadyAssigned) {
    role.assignedUsers.push(userId);
    await role.save();
  }

  if (role.permissions) {
    user.permissions = role.permissions;
    await user.save();
  }

  return user;
};
