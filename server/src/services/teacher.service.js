import Teacher from '../models/Teacher.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createTeacher = async (schoolId, data) => {
  const existing = await Teacher.findOne({ schoolId, employeeId: data.employeeId });
  if (existing) throw new ApiError(409, 'Employee ID already exists');
  const teacher = await Teacher.create({ ...data, schoolId });
  return teacher;
};

export const getTeachers = async (schoolId, options) => {
  const { status, gender, ...rest } = options;
  const filter = {};
  if (status) filter.status = status;
  if (gender) filter.gender = gender;
  return paginate(Teacher, { schoolId }, { ...rest, searchFields: ['firstName', 'lastName', 'employeeId', 'department'], filter });
};

export const getTeacherById = async (id, schoolId) => {
  const teacher = await Teacher.findOne({ _id: id, schoolId })
    .populate('subjects', 'name code')
    .populate('assignedClasses', 'name');
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return teacher;
};

export const updateTeacher = async (id, schoolId, data) => {
  const teacher = await Teacher.findOneAndUpdate({ _id: id, schoolId }, data, { new: true, runValidators: true });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return teacher;
};

export const deleteTeacher = async (id, schoolId) => {
  const teacher = await Teacher.findOneAndDelete({ _id: id, schoolId });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return true;
};

export const getWorkloadAnalytics = async (schoolId) => {
  const teachers = await Teacher.find({ schoolId })
    .populate('assignedClasses', 'name')
    .populate('subjects', 'name weeklyPeriods');

  return teachers.map((t) => ({
    _id: t._id,
    name: `${t.firstName} ${t.lastName}`,
    employeeId: t.employeeId,
    assignedClasses: t.assignedClasses?.length || 0,
    subjectsCount: t.subjects?.length || 0,
    totalWeeklyPeriods: t.subjects?.reduce((sum, s) => sum + (s.weeklyPeriods || 0), 0) || 0,
    department: t.department,
    isClassTeacher: t.isClassTeacher,
  }));
};
