import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import School from '../models/School.js';
import { generateTokens, verifyRefreshToken } from '../utils/generateTokens.js';
import AuditLog from '../models/AuditLog.js';

export const registerUser = async (userData, ip, userAgent) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  let schoolId = userData.schoolId;

  // For testing/generic registration: auto-create a school if one isn't provided
  if (!schoolId && userData.role !== 'super_admin') {
    const newSchool = await School.create({
      name: `${userData.name}'s School`,
      code: `SCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      contact: { email: userData.email },
    });
    schoolId = newSchool._id;
  }

  const user = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    schoolId: schoolId || null,
  });

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  user.sessions = [{ token: tokens.refreshToken, ip, device: userAgent, lastActivity: new Date() }];
  await user.save();

  await AuditLog.create({
    actor: user._id,
    action: 'register',
    entity: 'User',
    entityId: user._id,
    ip,
    userAgent,
  });

  const userObj = user.toJSON();
  return { user: userObj, ...tokens };
};

export const loginUser = async (email, password, ip, userAgent) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  user.sessions.push({ token: tokens.refreshToken, ip, device: userAgent, lastActivity: new Date() });
  await user.save();

  await AuditLog.create({
    schoolId: user.schoolId,
    actor: user._id,
    action: 'login',
    entity: 'User',
    entityId: user._id,
    ip,
    userAgent,
  });

  const userObj = user.toJSON();
  return { user: userObj, ...tokens };
};

export const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded._id);
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokens = generateTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user: user.toJSON(), ...tokens };
};

export const logoutUser = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.refreshToken = null;
  user.sessions = user.sessions.filter((s) => s.token !== refreshToken);
  await user.save();

  await AuditLog.create({
    actor: userId,
    action: 'logout',
    entity: 'User',
    entityId: userId,
  });

  return true;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.refreshToken = null;
  await user.save();

  return true;
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const updateProfile = async (userId, updates) => {
  const allowed = ['name', 'phone', 'avatar'];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }

  const user = await User.findByIdAndUpdate(userId, filtered, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const getSessions = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user.sessions || [];
};

export const revokeSession = async (userId, sessionToken) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.sessions = user.sessions.filter((s) => s.token !== sessionToken);
  if (user.refreshToken === sessionToken) {
    user.refreshToken = null;
  }
  await user.save();
  return true;
};
