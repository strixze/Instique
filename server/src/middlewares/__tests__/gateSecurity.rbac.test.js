import { describe, it, expect } from '@jest/globals';
import { requireRole, requirePermission } from '../rbac.middleware.js';
import ApiError from '../../utils/ApiError.js';

describe('Security Guard RBAC & Permission Isolation Tests', () => {
  const securityGuardUser = {
    _id: 'guard-123',
    role: 'security_guard',
    name: 'Security Officer',
    schoolId: 'school-123',
  };

  const schoolAdminUser = {
    _id: 'admin-123',
    role: 'school_admin',
    name: 'School Admin',
    schoolId: 'school-123',
  };

  const teacherUser = {
    _id: 'teacher-123',
    role: 'teacher',
    name: 'Class Teacher',
    schoolId: 'school-123',
  };

  const studentUser = {
    _id: 'student-123',
    role: 'student',
    name: 'Student User',
    schoolId: 'school-123',
  };

  describe('requireRole middleware', () => {
    it('should allow security_guard for security/gate endpoints', () => {
      const req = { user: securityGuardUser };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      requireRole('security_guard', 'school_admin')(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should reject student or parent from accessing gate endpoints', () => {
      const req = { user: studentUser };
      const res = {};
      const next = () => {};

      expect(() => {
        requireRole('security_guard', 'school_admin')(req, res, next);
      }).toThrow(ApiError);
    });

    it('should reject security_guard from admin-only routes', () => {
      const req = { user: securityGuardUser };
      const res = {};
      const next = () => {};

      expect(() => {
        requireRole('school_admin', 'super_admin')(req, res, next);
      }).toThrow(ApiError);
    });
  });

  describe('requirePermission middleware', () => {
    it('should allow security_guard to access gate security modules', () => {
      const allowedModules = ['gate_security', 'gate_logs', 'visitors', 'vehicles'];

      for (const mod of allowedModules) {
        const req = { user: securityGuardUser };
        const res = {};
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        requirePermission(mod, 'read')(req, res, next);
        expect(nextCalled).toBe(true);
      }
    });

    it('CRITICAL: should REJECT security_guard from academic Attendance with 403', () => {
      const req = { user: securityGuardUser };
      const res = {};
      const next = () => {};

      expect(() => {
        requirePermission('attendance', 'read')(req, res, next);
      }).toThrow(/Insufficient permissions/);
    });

    it('should REJECT security_guard from Fees, Marks, Exams, and Settings', () => {
      const restrictedModules = ['fees', 'marks', 'exams', 'settings', 'teachers', 'students'];

      for (const mod of restrictedModules) {
        const req = { user: securityGuardUser };
        const res = {};
        const next = () => {};

        expect(() => {
          requirePermission(mod, 'read')(req, res, next);
        }).toThrow(/Insufficient permissions/);
      }
    });

    it('should preserve permissions for existing roles (Admin, Teacher, Student)', () => {
      // School admin has default read on attendance
      let adminNext = false;
      requirePermission('attendance', 'read')({ user: schoolAdminUser }, {}, () => { adminNext = true; });
      expect(adminNext).toBe(true);

      // Teacher has default read on attendance
      let teacherNext = false;
      requirePermission('attendance', 'read')({ user: teacherUser }, {}, () => { teacherNext = true; });
      expect(teacherNext).toBe(true);

      // Student has default read on syllabus
      let studentNext = false;
      requirePermission('syllabus', 'read')({ user: studentUser }, {}, () => { studentNext = true; });
      expect(studentNext).toBe(true);
    });
  });
});
