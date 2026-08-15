/**
 * ConflictReporter — generates human-readable conflict messages
 * from raw constraint violation data.
 */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format a conflict object into a user-friendly message.
 */
export function formatConflict(conflict) {
  return {
    ...conflict,
    dayName: conflict.context?.day !== undefined ? DAY_NAMES[conflict.context.day] : undefined,
  };
}

/**
 * Group conflicts by type for summary reporting.
 */
export function groupConflicts(conflicts) {
  const groups = {};
  for (const conflict of conflicts) {
    if (!groups[conflict.type]) {
      groups[conflict.type] = {
        type: conflict.type,
        severity: conflict.severity,
        count: 0,
        items: [],
      };
    }
    groups[conflict.type].count++;
    groups[conflict.type].items.push(conflict);
  }
  return Object.values(groups);
}

/**
 * Generate a summary report from conflicts.
 */
export function generateConflictReport(conflicts) {
  const errors = conflicts.filter((c) => c.severity === 'error');
  const warnings = conflicts.filter((c) => c.severity === 'warning');
  const info = conflicts.filter((c) => c.severity === 'info');

  return {
    totalConflicts: conflicts.length,
    errors: errors.length,
    warnings: warnings.length,
    info: info.length,
    canGenerate: errors.length === 0,
    groups: groupConflicts(conflicts),
    messages: conflicts.map((c) => ({
      severity: c.severity,
      message: c.message,
      type: c.type,
    })),
  };
}

/**
 * Post-generation validation — check the generated timetable against all hard constraints.
 * Used to verify the final output and for manual edit validation.
 */
export function postValidateTimetable(periods, teachers, subjects, config) {
  const conflicts = [];
  const teacherDayPeriod = new Map();
  const classDayPeriod = new Map();
  const subjectDayCount = new Map();
  const teacherDayCount = new Map();
  const teacherWeeklyCount = new Map();
  const roomDayPeriod = new Map();

  for (const p of periods) {
    if (p.isLunch || p.isBreak || p.isAssembly || p.isFixed) continue;
    if (!p.subject || !p.teacher) continue;

    const teacherId = p.teacher.toString();
    const subjectId = p.subject.toString();

    // Teacher double-booking
    const tKey = `${teacherId}-${p.day}-${p.periodNo}`;
    if (teacherDayPeriod.has(tKey)) {
      const teacher = teachers.find((t) => t._id.toString() === teacherId);
      conflicts.push({
        type: 'teacher_double_booked',
        severity: 'error',
        message: `Teacher "${teacher?.firstName || 'Unknown'} ${teacher?.lastName || ''}" is double-booked on ${DAY_NAMES[p.day]} period ${p.periodNo}`,
        context: { teacherId, day: p.day, periodNo: p.periodNo },
      });
    } else {
      teacherDayPeriod.set(tKey, p);
    }

    // Teacher daily count
    const tdKey = `${teacherId}-${p.day}`;
    teacherDayCount.set(tdKey, (teacherDayCount.get(tdKey) || 0) + 1);

    // Teacher weekly count
    teacherWeeklyCount.set(teacherId, (teacherWeeklyCount.get(teacherId) || 0) + 1);

    // Subject daily count
    const sdKey = `${subjectId}-${p.day}`;
    subjectDayCount.set(sdKey, (subjectDayCount.get(sdKey) || 0) + 1);

    // Room double-booking
    if (p.room) {
      const rKey = `${p.room}-${p.day}-${p.periodNo}`;
      if (roomDayPeriod.has(rKey)) {
        conflicts.push({
          type: 'room_double_booked',
          severity: 'error',
          message: `Room "${p.room}" is double-booked on ${DAY_NAMES[p.day]} period ${p.periodNo}`,
          context: { room: p.room, day: p.day, periodNo: p.periodNo },
        });
      } else {
        roomDayPeriod.set(rKey, p);
      }
    }
  }

  // Teacher daily limit violations
  for (const [key, count] of teacherDayCount) {
    const [teacherId, dayStr] = key.split('-');
    const teacher = teachers.find((t) => t._id.toString() === teacherId);
    const limit = teacher?.dailyTeachingLimit || 6;
    if (count > limit) {
      conflicts.push({
        type: 'teacher_daily_overloaded',
        severity: 'error',
        message: `Teacher "${teacher?.firstName || 'Unknown'} ${teacher?.lastName || ''}" has ${count} periods on ${DAY_NAMES[parseInt(dayStr)]} (limit: ${limit})`,
        context: { teacherId, day: parseInt(dayStr), count, limit },
      });
    }
  }

  // Teacher weekly limit violations
  for (const [teacherId, count] of teacherWeeklyCount) {
    const teacher = teachers.find((t) => t._id.toString() === teacherId);
    const limit = teacher?.weeklyTeachingLimit || 30;
    if (count > limit) {
      conflicts.push({
        type: 'teacher_weekly_overloaded',
        severity: 'error',
        message: `Teacher "${teacher?.firstName || 'Unknown'} ${teacher?.lastName || ''}" has ${count} periods this week (limit: ${limit})`,
        context: { teacherId, count, limit },
      });
    }
  }

  // Subject max per day violations
  for (const [key, count] of subjectDayCount) {
    const [subjectId, dayStr] = key.split('-');
    const subject = subjects.find((s) => s._id.toString() === subjectId);
    const max = subject?.maxPeriodsPerDay || 2;
    if (count > max) {
      conflicts.push({
        type: 'subject_daily_exceeded',
        severity: 'warning',
        message: `Subject "${subject?.name || 'Unknown'}" has ${count} periods on ${DAY_NAMES[parseInt(dayStr)]} (max: ${max})`,
        context: { subjectId, day: parseInt(dayStr), count, max },
      });
    }
  }

  // Subject weekly completion check
  const subjectWeeklyCount = new Map();
  for (const p of periods) {
    if (p.isLunch || p.isBreak || p.isAssembly || !p.subject) continue;
    const sid = p.subject.toString();
    subjectWeeklyCount.set(sid, (subjectWeeklyCount.get(sid) || 0) + 1);
  }
  for (const subject of subjects) {
    const count = subjectWeeklyCount.get(subject._id.toString()) || 0;
    const required = subject.weeklyPeriods || 5;
    if (count < required) {
      conflicts.push({
        type: 'subject_incomplete',
        severity: 'warning',
        message: `Subject "${subject.name}" has ${count}/${required} periods assigned`,
        context: { subjectId: subject._id, assigned: count, required },
      });
    }
  }

  return conflicts;
}
