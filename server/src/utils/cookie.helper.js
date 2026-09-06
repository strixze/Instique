import env from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

/**
 * Access token cookie options
 * 15 minutes lifetime
 */
export const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
});

/**
 * Refresh token cookie options
 * 7 days lifetime, scoped to auth routes
 */
export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
});

/**
 * Clear access token cookie options
 * Must match sameSite, secure, and path of original cookie for browsers to delete it
 */
export const getClearAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
});

/**
 * Clear refresh token cookie options
 * Must match sameSite, secure, and path of original cookie for browsers to delete it
 */
export const getClearRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/api/v1/auth',
});
