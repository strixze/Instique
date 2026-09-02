import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as attendanceService from '../services/attendance.service.js';
import { 
  verifyParentAccessToStudent, 
  getTeacherScope,
  verifyTeacherClassAccess, 
  verifyTeacherSectionAccess, 
  verifyTeacherSubjectAccess, 
  verifyTeacherStudentAccess 
} from '../services/authorization.service.js';

export const markAttendance = asyncHandler(async (req, res) => {
  if (req.body.schoolClass) {
    await verifyTeacherSectionAccess(req.user, req.schoolId, req.body.schoolClass, req.body.section);
    if (req.body.subject) {
      await verifyTeacherSubjectAccess(req.user, req.schoolId, req.body.schoolClass, req.body.subject);
    }
  }
  const attendance = await attendanceService.markAttendance(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, attendance, 'Attendance marked'));
});

export const markAllPresent = asyncHandler(async (req, res) => {
  if (req.body.schoolClass) {
    await verifyTeacherSectionAccess(req.user, req.schoolId, req.body.schoolClass, req.body.section);
    if (req.body.subject) {
      await verifyTeacherSubjectAccess(req.user, req.schoolId, req.body.schoolClass, req.body.subject);
    }
  }
  const attendance = await attendanceService.markAllPresent(req.schoolId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, attendance, 'Attendance marked'));
});

export const getAttendance = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    const scope = await getTeacherScope(req.user, req.schoolId);
    if (req.query.schoolClass) {
      if (!scope.classIds.includes(req.query.schoolClass.toString())) {
        return res.status(200).json(new ApiResponse(200, [], 'Attendance fetched', { total: 0, page: 1, limit: 10, totalPages: 0 }));
      }
    } else {
      req.query.schoolClass = { $in: scope.classIds };
    }
  }
  const result = await attendanceService.getAttendance(req.schoolId, req.query);
  res.status(200).json(new ApiResponse(200, result.data, 'Attendance fetched', result.meta));
});

export const getStudentAttendance = asyncHandler(async (req, res) => {
  // Enforce access restrictions
  await verifyParentAccessToStudent(req.user, req.schoolId, req.params.studentId);
  await verifyTeacherStudentAccess(req.user, req.schoolId, req.params.studentId);
  const result = await attendanceService.getStudentAttendance(req.schoolId, req.params.studentId, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Attendance history and analytics fetched'));
});


export const getAttendanceReport = asyncHandler(async (req, res) => {
  const { classId, startDate, endDate } = req.query;
  if (classId) {
    await verifyTeacherClassAccess(req.user, req.schoolId, classId);
  }
  const report = await attendanceService.getAttendanceReport(req.schoolId, classId, startDate, endDate);
  res.status(200).json(new ApiResponse(200, report));
});

export const getStudentsByClassSection = asyncHandler(async (req, res) => {
  const { classId, sectionId } = req.query;
  if (classId) {
    await verifyTeacherSectionAccess(req.user, req.schoolId, classId, sectionId);
  }
  const students = await attendanceService.getStudentsByClassSection(req.schoolId, classId, sectionId);
  res.status(200).json(new ApiResponse(200, students));
});

export const getAttendanceForDate = asyncHandler(async (req, res) => {
  const { classId, sectionId, date } = req.query;
  if (classId) {
    await verifyTeacherSectionAccess(req.user, req.schoolId, classId, sectionId);
  }
  const attendance = await attendanceService.getAttendanceForDate(req.schoolId, classId, sectionId, date);
  res.status(200).json(new ApiResponse(200, attendance));
});
