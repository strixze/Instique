import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';
import env from '../config/env.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';

  const result = await authService.registerUser({ name, email, password, role }, ip, userAgent);

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });

  res.status(201).json(new ApiResponse(201, { user: result.user }, 'Registration successful'));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';

  const result = await authService.loginUser(email, password, ip, userAgent);

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });

  res.status(200).json(new ApiResponse(200, { user: result.user }, 'Login successful'));
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const result = await authService.refreshUserToken(refreshToken);

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json(new ApiResponse(200, { user: result.user }, 'Token refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logoutUser(req.user._id, refreshToken);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, user, 'Profile updated'));
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getSessions(req.user._id);
  res.status(200).json(new ApiResponse(200, sessions));
});

export const revokeSession = asyncHandler(async (req, res) => {
  const { token } = req.params;
  await authService.revokeSession(req.user._id, token);
  res.status(200).json(new ApiResponse(200, null, 'Session revoked'));
});

export const verifyActivationToken = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const result = await authService.verifyActivationToken(token);
  res.status(200).json(new ApiResponse(200, result, 'Activation token is valid'));
});

export const activateAccount = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const result = await authService.activateAccount(token, password, ip, userAgent);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const result = await authService.forgotPassword(email, ip, userAgent);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const result = await authService.verifyResetToken(token);
  res.status(200).json(new ApiResponse(200, result, 'Reset token is valid'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const result = await authService.resetPassword(token, password, ip, userAgent);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

