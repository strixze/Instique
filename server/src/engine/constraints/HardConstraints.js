/**
 * Hard Constraints — functions that return true if the constraint is SATISFIED.
 * Every function is pure: takes the grid state and checks a specific invariant.
 *
 * Grid structure: Map<string, PeriodSlot> where key = `${day}-${periodNo}`
 * Each class-section has its own grid; cross-class checks use the global teacher schedule.
 */

/**
 * Check that a teacher is not already booked at this day+period across ANY class.
 * @param {Map<string, object>} globalTeacherSchedule - key: `${teacherId}-${day}-${periodNo}`
 * @param {string} teacherId
 * @param {number} day
 * @param {number} periodNo
 * @returns {boolean}
 */
export function teacherNoDoubleBooking(globalTeacherSchedule, teacherId, day, periodNo) {
  const key = `${teacherId}-${day}-${periodNo}`;
  return !globalTeacherSchedule.has(key);
}

/**
 * Teacher can only teach subjects they are assigned to.
 */
export function teacherOnlyAssignedSubjects(teacher, subjectId) {
  if (!teacher.subjects || teacher.subjects.length === 0) return false;
  return teacher.subjects.some((s) => s.toString() === subjectId.toString());
}

/**
 * Teacher can only teach classes they are assigned to.
 */
export function teacherOnlyAssignedClasses(teacher, classId) {
  if (!teacher.assignedClasses || teacher.assignedClasses.length === 0) return false;
  return teacher.assignedClasses.some((c) => c.toString() === classId.toString());
}

/**
 * Teacher is available on this working day.
 */
export function teacherAvailableOnDay(teacher, day) {
  const available = teacher.availableWorkingDays || [1, 2, 3, 4, 5];
  return available.includes(day);
}

/**
 * Teacher is not explicitly unavailable for this day+period.
 */
export function teacherNotUnavailable(teacher, day, periodNo) {
  if (!teacher.unavailablePeriods || teacher.unavailablePeriods.length === 0) return true;
  return !teacher.unavailablePeriods.some((u) => u.day === day && u.periodNo === periodNo);
}

/**
 * Teacher has not exceeded daily teaching limit.
 * @param {Map<string, number>} teacherDayCounts - key: `${teacherId}-${day}`, value: count
 */
export function teacherDailyLimit(teacherDayCounts, teacherId, day, limit) {
  const key = `${teacherId}-${day}`;
  const current = teacherDayCounts.get(key) || 0;
  return current < limit;
}

/**
 * Teacher has not exceeded weekly teaching limit.
 * @param {Map<string, number>} teacherWeeklyCounts - key: teacherId, value: count
 */
export function teacherWeeklyLimit(teacherWeeklyCounts, teacherId, limit) {
  const current = teacherWeeklyCounts.get(teacherId) || 0;
  return current < limit;
}

/**
 * Class-section does not already have a subject assigned at this day+period.
 */
export function classNoDoubleBooking(classGrid, day, periodNo) {
  const key = `${day}-${periodNo}`;
  const slot = classGrid.get(key);
  return !slot || !slot.subject;
}

/**
 * Subject has not exceeded max periods per day for this class.
 * @param {Map<string, number>} subjectDayCounts - key: `${subjectId}-${day}`, value: count
 */
export function subjectMaxPerDay(subjectDayCounts, subjectId, day, max) {
  const key = `${subjectId}-${day}`;
  const current = subjectDayCounts.get(key) || 0;
  return current < max;
}

/**
 * Check that consecutive periods are available for a double-period subject.
 * @param {Map<string, object>} classGrid
 * @param {number} day
 * @param {number} startPeriod
 * @param {number} count - number of consecutive periods needed (2 or 3)
 * @param {number} totalPeriods - total periods in the day
 * @param {Array} nonTeachingPeriods - periods that are lunch/break/assembly
 */
export function consecutivePeriodsFit(classGrid, day, startPeriod, count, totalPeriods, nonTeachingPeriods = []) {
  if (startPeriod + count - 1 > totalPeriods) return false;

  for (let i = 0; i < count; i++) {
    const pNo = startPeriod + i;
    const key = `${day}-${pNo}`;
    const slot = classGrid.get(key);

    // Slot must be empty and not a non-teaching period
    if (slot && slot.subject) return false;
    if (nonTeachingPeriods.includes(pNo)) return false;
  }
  return true;
}

/**
 * Room is not double-booked across classes at this day+period.
 * @param {Map<string, string>} globalRoomSchedule - key: `${room}-${day}-${periodNo}`, value: classId
 */
export function roomNoDoubleBooking(globalRoomSchedule, room, day, periodNo) {
  if (!room) return true; // no room constraint
  const key = `${room}-${day}-${periodNo}`;
  return !globalRoomSchedule.has(key);
}

/**
 * Run all hard constraints for a potential placement.
 * Returns { valid: boolean, violations: string[] }
 */
export function validatePlacement({
  globalTeacherSchedule,
  teacherDayCounts,
  teacherWeeklyCounts,
  classGrid,
  subjectDayCounts,
  globalRoomSchedule,
  teacher,
  subjectId,
  classId,
  day,
  periodNo,
  room,
}) {
  const violations = [];

  if (!teacherNoDoubleBooking(globalTeacherSchedule, teacher._id.toString(), day, periodNo)) {
    violations.push(`Teacher ${teacher.firstName} ${teacher.lastName} already has a class at day ${day}, period ${periodNo}`);
  }
  if (!teacherOnlyAssignedSubjects(teacher, subjectId)) {
    violations.push(`Teacher ${teacher.firstName} ${teacher.lastName} is not assigned to this subject`);
  }
  if (!teacherOnlyAssignedClasses(teacher, classId)) {
    violations.push(`Teacher ${teacher.firstName} ${teacher.lastName} is not assigned to this class`);
  }
  if (!teacherAvailableOnDay(teacher, day)) {
    violations.push(`Teacher ${teacher.firstName} ${teacher.lastName} is not available on day ${day}`);
  }
  if (!teacherNotUnavailable(teacher, day, periodNo)) {
    violations.push(`Teacher ${teacher.firstName} ${teacher.lastName} is unavailable at day ${day}, period ${periodNo}`);
  }
  if (!teacherDailyLimit(teacherDayCounts, teacher._id.toString(), day, teacher.dailyTeachingLimit || 6)) {
    violations.push(`Teacher ${teacher.firstName} ${teacher.lastName} has reached daily limit on day ${day}`);
  }
  if (!teacherWeeklyLimit(teacherWeeklyCounts, teacher._id.toString(), teacher.weeklyTeachingLimit || 30)) {
    violations.push(`Teacher ${teacher.firstName} ${teacher.lastName} has reached weekly limit`);
  }
  if (!classNoDoubleBooking(classGrid, day, periodNo)) {
    violations.push(`Class already has a subject at day ${day}, period ${periodNo}`);
  }
  if (!subjectMaxPerDay(subjectDayCounts, subjectId.toString(), day, 99)) {
    violations.push(`Subject has exceeded max periods per day on day ${day}`);
  }
  if (room && !roomNoDoubleBooking(globalRoomSchedule, room, day, periodNo)) {
    violations.push(`Room ${room} is already occupied at day ${day}, period ${periodNo}`);
  }

  return { valid: violations.length === 0, violations };
}
