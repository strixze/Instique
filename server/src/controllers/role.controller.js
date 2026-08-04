import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as roleService from '../services/role.service.js';

export const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.schoolId, req.body);
  res.status(201).json(new ApiResponse(201, role, 'Role created'));
});

export const getRoles = asyncHandler(async (req, res) => {
  const result = await roleService.getRoles(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Roles fetched', result.meta));
});

export const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, role));
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.schoolId, req.body);
  res.status(200).json(new ApiResponse(200, role, 'Role updated'));
});

export const deleteRole = asyncHandler(async (req, res) => {
  await roleService.deleteRole(req.params.id, req.schoolId);
  res.status(200).json(new ApiResponse(200, null, 'Role deleted'));
});

export const assignRole = asyncHandler(async (req, res) => {
  const user = await roleService.assignRole(req.schoolId, req.body.userId, req.body.roleId);
  res.status(200).json(new ApiResponse(200, user, 'Role assigned'));
});
