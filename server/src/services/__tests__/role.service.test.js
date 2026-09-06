import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import {
  ensureDefaultRoles,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
} from '../role.service.js';
import Role from '../../models/Role.js';
import User from '../../models/User.js';

describe('Role Service Unit Tests', () => {
  const schoolId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();
  const roleId = new mongoose.Types.ObjectId().toString();

  let originals = {};

  beforeEach(() => {
    originals = {
      RoleCountDocuments: Role.countDocuments,
      RoleInsertMany: Role.insertMany,
      RoleFind: Role.find,
      RoleFindOne: Role.findOne,
      RoleCreate: Role.create,
      RoleDeleteOne: Role.deleteOne,
      UserFindOne: User.findOne,
    };
  });

  afterEach(() => {
    Role.countDocuments = originals.RoleCountDocuments;
    Role.insertMany = originals.RoleInsertMany;
    Role.find = originals.RoleFind;
    Role.findOne = originals.RoleFindOne;
    Role.create = originals.RoleCreate;
    Role.deleteOne = originals.RoleDeleteOne;
    User.findOne = originals.UserFindOne;
    jest.restoreAllMocks();
  });

  it('1. ensureDefaultRoles should seed default roles when count is 0', async () => {
    Role.countDocuments = jest.fn().mockResolvedValue(0);
    Role.insertMany = jest.fn().mockResolvedValue([]);

    await ensureDefaultRoles(schoolId);

    expect(Role.countDocuments).toHaveBeenCalledWith({ schoolId });
    expect(Role.insertMany).toHaveBeenCalledTimes(1);
    const seeded = Role.insertMany.mock.calls[0][0];
    expect(seeded.length).toBe(4);
    expect(seeded.map((r) => r.name)).toContain('Teacher');
    expect(seeded.map((r) => r.name)).toContain('Accountant');
  });

  it('2. getRoles should return paginated roles', async () => {
    Role.countDocuments = jest.fn()
      .mockResolvedValueOnce(4) // inside ensureDefaultRoles
      .mockResolvedValueOnce(2); // inside paginate total

    const mockRoles = [
      { _id: 'r1', name: 'Teacher', isSystem: true },
      { _id: 'r2', name: 'Custom Role', isSystem: false },
    ];

    Role.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockRoles),
    });

    const result = await getRoles(schoolId, { page: 1, limit: 10 });
    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('3. getRoleById should find role and populate assignedUsers', async () => {
    const mockRole = { _id: roleId, name: 'Teacher', schoolId };
    Role.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRole),
    });

    const result = await getRoleById(roleId, schoolId);
    expect(result._id).toBe(roleId);
    expect(result.name).toBe('Teacher');
  });

  it('4. createRole should create a new role and reject duplicates', async () => {
    Role.findOne = jest.fn().mockResolvedValue(null);
    Role.create = jest.fn().mockImplementation((data) => Promise.resolve({ _id: 'new-id', ...data }));

    const created = await createRole(schoolId, {
      name: 'Librarian',
      description: 'Book manager',
      permissions: { students: ['read'] },
    });

    expect(created.name).toBe('Librarian');
    expect(created.isSystem).toBe(false);

    // Duplicate test
    Role.findOne = jest.fn().mockResolvedValue({ _id: 'existing', name: 'Librarian' });
    await expect(createRole(schoolId, { name: 'Librarian' })).rejects.toThrow(
      'A role named "Librarian" already exists'
    );
  });

  it('5. updateRole should update details and permissions', async () => {
    const mockRole = {
      _id: roleId,
      schoolId,
      name: 'Old Role',
      description: 'Old desc',
      permissions: {},
      save: jest.fn().mockResolvedValue(true),
    };

    Role.findOne = jest.fn()
      .mockResolvedValueOnce(mockRole) // find current role
      .mockResolvedValueOnce(null); // check duplicate name

    const updated = await updateRole(roleId, schoolId, {
      name: 'Updated Role',
      description: 'New desc',
      permissions: { fees: ['read'] },
    });

    expect(updated.name).toBe('Updated Role');
    expect(updated.description).toBe('New desc');
    expect(mockRole.save).toHaveBeenCalled();
  });

  it('6. deleteRole should prevent deleting system roles and roles with users', async () => {
    const systemRole = { _id: roleId, schoolId, isSystem: true, assignedUsers: [] };
    Role.findOne = jest.fn().mockResolvedValue(systemRole);

    await expect(deleteRole(roleId, schoolId)).rejects.toThrow('System roles cannot be deleted');

    const roleWithUsers = { _id: roleId, schoolId, isSystem: false, assignedUsers: ['u1'] };
    Role.findOne = jest.fn().mockResolvedValue(roleWithUsers);

    await expect(deleteRole(roleId, schoolId)).rejects.toThrow(/Cannot delete role with 1 assigned user/);

    const safeRole = { _id: roleId, schoolId, isSystem: false, assignedUsers: [] };
    Role.findOne = jest.fn().mockResolvedValue(safeRole);
    Role.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

    const deleted = await deleteRole(roleId, schoolId);
    expect(deleted).toBe(true);
  });

  it('7. assignRole should attach user to role and sync permissions', async () => {
    const mockRole = {
      _id: roleId,
      schoolId,
      assignedUsers: [],
      permissions: { students: ['read'] },
      save: jest.fn().mockResolvedValue(true),
    };

    const mockUser = {
      _id: userId,
      schoolId,
      permissions: {},
      save: jest.fn().mockResolvedValue(true),
    };

    Role.findOne = jest.fn().mockResolvedValue(mockRole);
    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const res = await assignRole(schoolId, userId, roleId);
    expect(mockRole.assignedUsers).toContain(userId);
    expect(mockRole.save).toHaveBeenCalled();
    expect(mockUser.permissions).toEqual({ students: ['read'] });
    expect(mockUser.save).toHaveBeenCalled();
  });
});
