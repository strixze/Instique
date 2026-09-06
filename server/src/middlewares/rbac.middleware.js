import ApiError from '../utils/ApiError.js';
import { isFeatureEnabled } from '../services/setting.service.js';

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    next();
  };
};

export const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const { role, permissions } = req.user;

    const superAdminModules = [
      'schools', 'subscriptions', 'platform-analytics',
    ];
    if (role === 'super_admin') return next();

    if (role === 'school_admin' || role === 'teacher' || role === 'student' || role === 'parent') {
      if (permissions && permissions[module]) {
        if (permissions[module].includes(action) || permissions[module].includes('all')) {
          return next();
        }
      }

      const roleDefaults = {
        school_admin: ['read', 'write', 'update', 'delete'],
        teacher: ['read', 'write', 'update'],
        student: ['read'],
        parent: ['read'],
      };

      if (roleDefaults[role] && roleDefaults[role].includes(action)) {
        return next();
      }
    }

    throw new ApiError(403, `Insufficient permissions for ${module}:${action}`);
  };
};

export const requireFeature = (moduleKey) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next();
      if (!req.schoolId) return next();

      const enabled = await isFeatureEnabled(req.schoolId, moduleKey);
      if (!enabled) {
        throw new ApiError(403, `The '${moduleKey}' module has been disabled by your school administrator.`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
