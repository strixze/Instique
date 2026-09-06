import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { verifyRefreshToken } from '../utils/generateTokens.js';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearAccessTokenCookieOptions,
  getClearRefreshTokenCookieOptions,
} from '../utils/cookie.helper.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';

  const result = await authService.registerUser({ name, email, password, role }, ip, userAgent);

  res.cookie('accessToken', result.accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

  logger.info(`[AUTH] User registered: ${result.user.email} (${result.user.role})`);

  res.status(201).json(new ApiResponse(201, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }, 'Registration successful'));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';

  const result = await authService.loginUser(email, password, ip, userAgent);

  res.cookie('accessToken', result.accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

  logger.info(`[AUTH] User login successful: ${result.user.email} (${result.user.role})`);

  res.status(200).json(new ApiResponse(200, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }, 'Login successful'));
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    logger.warn(`[AUTH] Refresh token missing from request (cookies: ${Boolean(req.cookies?.refreshToken)}, body: ${Boolean(req.body?.refreshToken)})`);
  }

  const result = await authService.refreshUserToken(refreshToken);

  res.cookie('accessToken', result.accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

  res.status(200).json(new ApiResponse(200, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  }, 'Token refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const userId = req.user?._id;

  if (userId) {
    await authService.logoutUser(userId, refreshToken);
    logger.info(`[AUTH] User logged out: ${userId}`);
  } else if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded?._id) {
        await authService.logoutUser(decoded._id, refreshToken);
        logger.info(`[AUTH] User session cleared via refresh token: ${decoded._id}`);
      }
    } catch {
      // Refresh token might already be expired or invalid; cookies will still be cleared
    }
  }

  res.clearCookie('accessToken', getClearAccessTokenCookieOptions());
  res.clearCookie('refreshToken', getClearRefreshTokenCookieOptions());

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

