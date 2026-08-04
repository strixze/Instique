import School from '../models/School.js';
import Subscription from '../models/Subscription.js';
import Setting from '../models/Setting.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createSchool = async (data) => {
  const existing = await School.findOne({ code: data.code });
  if (existing) throw new ApiError(409, 'School code already exists');

  const school = await School.create(data);

  await Subscription.create({
    schoolId: school._id,
    plan: 'free_trial',
    status: 'trial',
    trialStart: new Date(),
    trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimits: { students: 100, teachers: 20, storage: 1024 },
  });

  await Setting.create({
    schoolId: school._id,
    gradingScale: [
      { grade: 'A+', minPercent: 90, maxPercent: 100, points: 4.0 },
      { grade: 'A', minPercent: 80, maxPercent: 89, points: 3.7 },
      { grade: 'B+', minPercent: 70, maxPercent: 79, points: 3.3 },
      { grade: 'B', minPercent: 60, maxPercent: 69, points: 3.0 },
      { grade: 'C', minPercent: 50, maxPercent: 59, points: 2.0 },
      { grade: 'D', minPercent: 40, maxPercent: 49, points: 1.0 },
      { grade: 'F', minPercent: 0, maxPercent: 39, points: 0 },
    ],
    feeSettings: { dueDayOfMonth: 10, lateFeeEnabled: true, lateFeePerDay: 10, paymentMethods: ['cash', 'online', 'cheque'] },
    notificationToggles: { attendance: true, homework: true, fee: true, exam: true, events: true, general: true },
    academicSettings: { maxSubjectsPerTeacher: 5, maxPeriodsPerDay: 8, workingDays: [1, 2, 3, 4, 5] },
  });

  return school;
};

export const getSchools = async (options) => {
  return paginate(School, {}, options);
};

export const getSchoolById = async (id) => {
  const school = await School.findById(id).populate('subscription');
  if (!school) throw new ApiError(404, 'School not found');
  return school;
};

export const updateSchool = async (id, data) => {
  const school = await School.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!school) throw new ApiError(404, 'School not found');
  return school;
};

export const deleteSchool = async (id) => {
  const school = await School.findByIdAndDelete(id);
  if (!school) throw new ApiError(404, 'School not found');
  return true;
};
