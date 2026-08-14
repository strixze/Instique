import TimetableConfig from '../models/TimetableConfig.js';
import ApiError from '../utils/ApiError.js';

export const createConfig = async (schoolId, data) => {
  const existing = await TimetableConfig.findOne({ schoolId, academicYear: data.academicYear });
  if (existing) {
    throw new ApiError(409, 'Timetable configuration already exists for this academic year.');
  }

  const config = await TimetableConfig.create({
    schoolId,
    ...data,
  });

  return config;
};

export const getConfig = async (schoolId, academicYear) => {
  const config = await TimetableConfig.findOne({ schoolId, academicYear });
  if (!config) {
    // If not found, create a default configuration
    const defaultTimings = Array.from({ length: 8 }).map((_, i) => {
      const startHour = 8 + i;
      const endHour = 8 + i;
      return {
        periodNo: i + 1,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:45`,
        type: i === 3 ? 'lunch' : 'teaching',
        label: i === 3 ? 'Lunch Break' : `Period ${i + 1}`,
      };
    });

    return await TimetableConfig.create({
      schoolId,
      academicYear,
      workingDays: [1, 2, 3, 4, 5, 6],
      periodsPerDay: 8,
      periodTimings: defaultTimings,
      schoolStartTime: '08:00',
      schoolEndTime: '14:30',
      lunchBreaks: [{ afterPeriod: 4, durationMinutes: 45 }],
      assemblyConfig: { enabled: false, periodNo: 1, days: [1, 2, 3, 4, 5, 6], durationMinutes: 15 },
      fixedEvents: [],
    });
  }
  return config;
};

export const updateConfig = async (id, schoolId, data) => {
  const config = await TimetableConfig.findOneAndUpdate(
    { _id: id, schoolId },
    data,
    { new: true, runValidators: true }
  );

  if (!config) {
    throw new ApiError(404, 'Timetable configuration not found');
  }

  return config;
};
