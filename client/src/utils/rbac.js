/**
 * Centralized Role Definitions and Route Authorization Matrix for Instique
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
};

// Route Permission Matrix: Maps route paths to allowed role arrays
export const ROUTE_PERMISSIONS = {
  '/dashboard': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/students': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN],
  '/teachers': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN],
  '/admissions': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN],
  '/academic': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN],
  '/timetable': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/timetable-config': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN],
  '/attendance': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/homework': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/exams': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/marks-entry': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER],
  '/leaderboard': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/fees': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/notices': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/events': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT],
  '/parent-meetings': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT],
  '/leaves': [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT],
  '/complaints': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN, ROLES.PARENT, ROLES.STUDENT],
  '/roles': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN],
  '/settings': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN],
  '/reports': [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN],
};

/**
 * Checks if a user has one of the specified allowed roles.
 */
export function hasRole(user, allowedRoles) {
  if (!user || !user.role) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const userRole = String(user.role).toLowerCase();
  return allowedRoles.map((r) => String(r).toLowerCase()).includes(userRole);
}

/**
 * Checks if a user is authorized to access a given route path.
 */
export function canAccessRoute(user, routePath) {
  if (!user) return false;
  const allowed = ROUTE_PERMISSIONS[routePath];
  if (!allowed) return true;
  return hasRole(user, allowed);
}
