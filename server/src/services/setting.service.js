import Setting from '../models/Setting.js';
import ApiError from '../utils/ApiError.js';

export const getSettings = async (schoolId) => {
  let settings = await Setting.findOne({ schoolId });
  if (!settings) {
    settings = await Setting.create({
      schoolId,
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
      academicSettings: { maxSubjectsPerTeacher: 5, maxPeriodsPerDay: 8, workingDays: [1, 2, 3, 4, 5, 6] },
    });
  }
  return settings;
};

export const updateSettings = async (schoolId, data) => {
  const settings = await Setting.findOneAndUpdate({ schoolId }, data, { new: true, upsert: true });
  return settings;
};
