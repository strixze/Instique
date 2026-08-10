/**
 * conflict.service.js
 * Fast in-memory lookup conflict checker for teacher, class, and subject constraints.
 */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Checks if a teacher is already occupied at the given day and period.
 */
export const checkTeacherConflict = (teacherId, day, periodNo, teacherSchedule) => {
  const key = `${teacherId}-${day}-${periodNo}`;
  if (teacherSchedule.has(key)) {
    const occupant = teacherSchedule.get(key);
    return {
      valid: false,
      reason: `Teacher is already assigned to class ${occupant.className} ${occupant.sectionName} at ${DAY_NAMES[day]} Period ${periodNo}`
    };
  }
  return { valid: true };
};

/**
 * Checks if a class section slot is already filled.
 */
export const checkClassConflict = (classSectionKey, day, periodNo, classSchedule) => {
  const key = `${classSectionKey}-${day}-${periodNo}`;
  if (classSchedule.has(key)) {
    const existing = classSchedule.get(key);
    return {
      valid: false,
      reason: `Class section slot is already occupied by subject ${existing.subjectName} at ${DAY_NAMES[day]} Period ${periodNo}`
    };
  }
  return { valid: true };
};

/**
 * Checks if a subject has already exceeded its daily limit for a class section.
 */
export const checkSubjectConstraint = (classSectionKey, subjectId, day, maxPeriodsPerDay, classSchedule) => {
  // Count how many times this subject is scheduled on this day in this class section
  let count = 0;
  // Since we only need to check the current day, we search classSchedule keys matching the pattern
  const prefix = `${classSectionKey}-${day}-`;
  for (const [key, value] of classSchedule.entries()) {
    if (key.startsWith(prefix) && value.subjectId === subjectId) {
      count++;
    }
  }

  if (count >= maxPeriodsPerDay) {
    return {
      valid: false,
      reason: `Subject exceeds daily maximum of ${maxPeriodsPerDay} periods on ${DAY_NAMES[day]}`
    };
  }
  return { valid: true };
};

/**
 * Checks if a teacher's daily teaching period limit is exceeded.
 */
export const checkDailyLimit = (teacherId, day, limit, teacherLoad) => {
  const load = teacherLoad.get(teacherId);
  const dailyCount = load?.dailyCount?.get(day) || 0;
  if (dailyCount >= limit) {
    return {
      valid: false,
      reason: `Teacher exceeds daily limit of ${limit} periods on ${DAY_NAMES[day]}`
    };
  }
  return { valid: true };
};

/**
 * Checks if a teacher's weekly teaching period limit is exceeded.
 */
export const checkWeeklyLimit = (teacherId, limit, teacherLoad) => {
  const load = teacherLoad.get(teacherId);
  const weeklyCount = load?.weeklyCount || 0;
  if (weeklyCount >= limit) {
    return {
      valid: false,
      reason: `Teacher exceeds weekly limit of ${limit} periods`
    };
  }
  return { valid: true };
};

/**
 * Checks if the given day and period matches the teacher's availability and unavailable periods.
 */
export const checkAvailability = (teacher, day, periodNo) => {
  // Check available working days
  const availableDays = teacher.availableWorkingDays || [1, 2, 3, 4, 5];
  if (!availableDays.includes(day)) {
    return {
      valid: false,
      reason: `Teacher is not available on ${DAY_NAMES[day]}`
    };
  }

  // Check unavailable periods list
  const unavailable = teacher.unavailablePeriods || [];
  const isUnavailable = unavailable.some(up => up.day === day && up.periodNo === periodNo);
  if (isUnavailable) {
    return {
      valid: false,
      reason: `Period ${periodNo} on ${DAY_NAMES[day]} is marked as unavailable for the teacher`
    };
  }

  return { valid: true };
};
