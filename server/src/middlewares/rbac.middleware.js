import ApiError from '../utils/ApiError.js';

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
