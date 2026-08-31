/**
 * Soft Constraints — scoring functions that return a numeric score.
 * Higher scores are preferred. These guide optimization but never block placement.
 */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Penalize uneven teacher workload distribution across days.
 * Returns higher score when adding to a day that has fewer periods.
 */
export function balanceTeacherWorkload(teacherDayCounts, teacherId, day, workingDays) {
  const counts = workingDays.map((d) => teacherDayCounts.get(`${teacherId}-${d}`) || 0);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const currentDay = teacherDayCounts.get(`${teacherId}-${day}`) || 0;

  // Bonus for being below average, penalty for being above
  return Math.max(0, 10 - Math.abs(currentDay - avg) * 3);
}

/**
 * Minimize free gaps between a teacher's lectures on a given day.
 * Looks at existing periods and penalizes if this creates a gap.
 */
export function minimizeTeacherGaps(teacherDayPeriods, teacherId, day, periodNo) {
  const key = `${teacherId}-${day}`;
  const periods = teacherDayPeriods.get(key) || [];
  if (periods.length === 0) return 5; // first period, neutral

  const allPeriods = [...periods, periodNo].sort((a, b) => a - b);
  let gaps = 0;
  for (let i = 1; i < allPeriods.length; i++) {
    gaps += allPeriods[i] - allPeriods[i - 1] - 1;
  }

  return Math.max(0, 10 - gaps * 4);
}

/**
 * Avoid scheduling the same subject more than once per day when possible.
 */
export function avoidSameSubjectRepeat(subjectDayCounts, subjectId, day) {
  const current = subjectDayCounts.get(`${subjectId}-${day}`) || 0;
  if (current === 0) return 10;
  if (current === 1) return 3;
  return 0;
}

/**
 * Prefer academic subjects (Math, Science) in morning periods.
 * Periods 1-4 are "morning", 5+ are "afternoon".
 */
export function preferMorningForAcademic(periodNo, subjectCategory) {
  if (subjectCategory === 'academic') {
    return periodNo <= 4 ? 8 : 2;
  }
  return 5; // neutral for non-academic
}

/**
 * Prefer sports, arts, activities in afternoon periods.
 */
export function preferAfternoonForActivities(periodNo, subjectCategory) {
  if (subjectCategory === 'sports' || subjectCategory === 'arts' || subjectCategory === 'activity') {
    return periodNo >= 5 ? 8 : 2;
  }
  return 5;
}

/**
 * Even distribution of a subject's periods across the week.
 * Prefer days that have fewer occurrences of this subject.
 */
export function evenDistribution(subjectDayCounts, subjectId, day, workingDays) {
  const counts = workingDays.map((d) => subjectDayCounts.get(`${subjectId}-${d}`) || 0);
  const currentDay = subjectDayCounts.get(`${subjectId}-${day}`) || 0;
  const min = Math.min(...counts);

  if (currentDay === min) return 10;
  if (currentDay === min + 1) return 4;
  return 0;
}

/**
 * Reduce unnecessary consecutive lectures for teachers.
 * Penalize if teacher already has 3+ consecutive periods ending right before this slot.
 */
export function reduceConsecutiveLectures(teacherDayPeriods, teacherId, day, periodNo) {
  const key = `${teacherId}-${day}`;
  const periods = teacherDayPeriods.get(key) || [];
  if (periods.length === 0) return 8;

  // Count consecutive periods ending right before this one
  let consecutive = 0;
  let p = periodNo - 1;
  while (periods.includes(p)) {
    consecutive++;
    p--;
  }

  if (consecutive >= 3) return 0;
  if (consecutive >= 2) return 3;
  return 8;
}

/**
 * Bonus for matching teacher's preferred periods.
 */
export function teacherPreferredPeriod(teacher, day, periodNo) {
  if (!teacher.preferredPeriods || teacher.preferredPeriods.length === 0) return 5;
  const match = teacher.preferredPeriods.some((p) => p.day === day && p.periodNo === periodNo);
  return match ? 12 : 5;
}

/**
 * Bonus for matching subject's preferred periods.
 */
export function subjectPreferredPeriod(subject, day, periodNo) {
  if (!subject.preferredPeriods || subject.preferredPeriods.length === 0) return 5;
  const match = subject.preferredPeriods.some((p) => p.day === day && p.periodNo === periodNo);
  return match ? 12 : 5;
}

/**
 * Calculate total soft score for a placement candidate.
 */
export function calculateSoftScore({
  teacherDayCounts,
  teacherDayPeriods,
  subjectDayCounts,
  teacher,
  subject,
  day,
  periodNo,
  workingDays,
}) {
  let score = 0;

  score += balanceTeacherWorkload(teacherDayCounts, teacher._id.toString(), day, workingDays);
  score += minimizeTeacherGaps(teacherDayPeriods, teacher._id.toString(), day, periodNo);
  score += avoidSameSubjectRepeat(subjectDayCounts, subject._id.toString(), day);
  score += preferMorningForAcademic(periodNo, subject.category || 'academic');
  score += preferAfternoonForActivities(periodNo, subject.category || 'academic');
  score += evenDistribution(subjectDayCounts, subject._id.toString(), day, workingDays);
  score += reduceConsecutiveLectures(teacherDayPeriods, teacher._id.toString(), day, periodNo);
  score += teacherPreferredPeriod(teacher, day, periodNo);
  score += subjectPreferredPeriod(subject, day, periodNo);

  return score;
}
