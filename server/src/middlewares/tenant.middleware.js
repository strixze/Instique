import ApiError from '../utils/ApiError.js';

const tenantMiddleware = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (req.user.role === 'super_admin') {
    req.schoolId = null;
    return next();
  }

  if (!req.user.schoolId) {
    throw new ApiError(403, 'No school association found');
  }

  req.schoolId = req.user.schoolId;
  next();
};

export default tenantMiddleware;
