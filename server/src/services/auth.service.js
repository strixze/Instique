import crypto from 'crypto';
import User from '../models/User.js';
import AccountToken from '../models/AccountToken.js';
import ApiError from '../utils/ApiError.js';
import School from '../models/School.js';
import env from '../config/env.js';
import { generateTokens, verifyRefreshToken } from '../utils/generateTokens.js';
import AuditLog from '../models/AuditLog.js';
import { sendEmail } from './brevoMail.service.js';
import { getPasswordResetEmailTemplate } from './emailTemplates/passwordReset.template.js';


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

export const verifyActivationToken = async (rawToken) => {
  if (!rawToken) {
    throw new ApiError(400, 'Activation token is required');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenDoc = await AccountToken.findOne({ tokenHash, type: 'activation' });

  if (!tokenDoc) {
    throw new ApiError(400, 'Invalid activation link. Please request a new activation link from your school administrator.');
  }

  if (tokenDoc.usedAt) {
    throw new ApiError(400, 'This activation link has already been used. Please log in to your account.');
  }

  if (new Date() > new Date(tokenDoc.expiresAt)) {
    throw new ApiError(400, 'This activation link has expired. Please ask your school administrator to resend the activation link.');
  }

  const user = await User.findById(tokenDoc.userId).populate('schoolId', 'name');
  if (!user) {
    throw new ApiError(404, 'Associated user account was not found.');
  }

  return {
    valid: true,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolName: user.schoolId?.name || 'Instique School'
  };
};

export const activateAccount = async (rawToken, password, ip, userAgent) => {
  if (!rawToken) {
    throw new ApiError(400, 'Activation token is required');
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenDoc = await AccountToken.findOne({ tokenHash, type: 'activation' });

  if (!tokenDoc) {
    throw new ApiError(400, 'Invalid activation token.');
  }

  if (tokenDoc.usedAt) {
    throw new ApiError(400, 'This activation link has already been used. You can proceed to log in.');
  }

  if (new Date() > new Date(tokenDoc.expiresAt)) {
    throw new ApiError(400, 'This activation link has expired. Please request a new activation email.');
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    throw new ApiError(404, 'User account not found.');
  }

  // Update password and activate user
  user.password = password;
  user.status = 'active';
  user.isActive = true;
  user.emailVerified = true;
  user.passwordChangedAt = new Date();
  await user.save();

  // Mark token as used
  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  // Invalidate any other active activation tokens for this user
  await AccountToken.updateMany(
    { userId: user._id, type: 'activation', _id: { $ne: tokenDoc._id }, usedAt: null },
    { usedAt: new Date() }
  );

  // Record Audit Activity
  await AuditLog.create({
    schoolId: user.schoolId,
    actor: user._id,
    action: 'parent_account_activated',
    entity: 'User',
    entityId: user._id,
    ip,
    userAgent
  });

  return {
    success: true,
    message: 'Your account has been successfully activated. You may now log in.'
  };
};

export const forgotPassword = async (email, ip, userAgent) => {
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Generic message for security (prevent user enumeration)
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  };

  if (!user || !user.isActive) {
    return genericResponse;
  }

  // Invalidate previous password reset tokens
  await AccountToken.updateMany(
    { userId: user._id, type: 'password_reset', usedAt: null },
    { usedAt: new Date() }
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const resetToken = await AccountToken.create({
    tokenHash,
    userId: user._id,
    type: 'password_reset',
    expiresAt,
    emailDeliveryStatus: 'pending'
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
  const emailHtml = getPasswordResetEmailTemplate({
    userName: user.name,
    resetUrl,
    expiryMinutes: 60
  });

  const emailResult = await sendEmail(
    user.email,
    'Reset Your Instique Password',
    emailHtml,
    user.name
  );

  if (emailResult.success) {
    await AccountToken.findByIdAndUpdate(resetToken._id, { emailDeliveryStatus: 'sent' });
  } else {
    await AccountToken.findByIdAndUpdate(resetToken._id, {
      emailDeliveryStatus: 'failed',
      emailDeliveryError: emailResult.error
    });
  }

  await AuditLog.create({
    schoolId: user.schoolId,
    actor: user._id,
    action: 'forgot_password_requested',
    entity: 'User',
    entityId: user._id,
    ip,
    userAgent
  });

  return genericResponse;
};

export const verifyResetToken = async (rawToken) => {
  if (!rawToken) {
    throw new ApiError(400, 'Reset token is required');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenDoc = await AccountToken.findOne({ tokenHash, type: 'password_reset' });

  if (!tokenDoc || tokenDoc.usedAt || new Date() > new Date(tokenDoc.expiresAt)) {
    throw new ApiError(400, 'Password reset link is invalid or has expired.');
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return {
    valid: true,
    email: user.email
  };
};

export const resetPassword = async (rawToken, newPassword, ip, userAgent) => {
  if (!rawToken) {
    throw new ApiError(400, 'Reset token is required');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenDoc = await AccountToken.findOne({ tokenHash, type: 'password_reset' });

  if (!tokenDoc || tokenDoc.usedAt || new Date() > new Date(tokenDoc.expiresAt)) {
    throw new ApiError(400, 'Password reset link is invalid or has expired.');
  }

  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.refreshToken = null;
  user.sessions = [];
  await user.save();

  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  await AccountToken.updateMany(
    { userId: user._id, type: 'password_reset', _id: { $ne: tokenDoc._id }, usedAt: null },
    { usedAt: new Date() }
  );

  await AuditLog.create({
    schoolId: user.schoolId,
    actor: user._id,
    action: 'password_reset_completed',
    entity: 'User',
    entityId: user._id,
    ip,
    userAgent
  });

  return {
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.'
  };
};

