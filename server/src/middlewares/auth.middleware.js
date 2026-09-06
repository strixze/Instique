import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { User } from '../models/User.js';

const authMiddleware = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    logger.warn(`[AUTH] 401 Unauthorized: No access token provided for ${req.method} ${req.originalUrl}`);
    throw new ApiError(401, 'Authentication required');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded._id).select('-password -refreshToken');
    if (!user) {
      logger.warn(`[AUTH] 401 Unauthorized: User not found for token on ${req.method} ${req.originalUrl}`);
      throw new ApiError(401, 'User not found');
    }
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.warn(`[AUTH] 401 Unauthorized: ${error.name} - ${error.message} on ${req.method} ${req.originalUrl}`);
    throw new ApiError(401, 'Invalid or expired token');
  }
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded._id).select('-password -refreshToken');
      if (user) {
        req.user = user;
      }
    } catch {
      // Silently proceed for optional auth
    }
  }
  next();
});

export default authMiddleware;

