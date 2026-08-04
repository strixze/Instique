/**
 * PreValidator — detects impossible configurations BEFORE attempting generation.
 * Returns an array of human-readable conflict objects.
 */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * @typedef {Object} PreValidationResult
 * @property {boolean} valid
 * @property {Array<{type: string, severity: string, message: string, context: object}>} conflicts
 */

/**
 * Validate a single class-section configuration.
 * @param {object} params
 * @param {object} params.schoolClass
 * @param {object} params.section
 * @param {Array} params.subjects - subjects assigned to this class
 * @param {Array} params.teachers - all active teachers in the school
 * @param {object} params.config - TimetableConfig
 * @returns {PreValidationResult}
 */
export function preValidateClassSection({ schoolClass, section, subjects, teachers, config }) {
  const conflicts = [];
  const classId = schoolClass._id.toString();
  const workingDays = config.workingDays || [1, 2, 3, 4, 5];
  const periodsPerDay = config.periodsPerDay || 8;

  // Calculate available teaching slots per day (exclude lunch, break, assembly)
  const nonTeachingPeriods = getNonTeachingPeriods(config);
  const teachingSlotsPerDay = periodsPerDay - nonTeachingPeriods.length;
  const totalWeeklySlots = teachingSlotsPerDay * workingDays.length;

  // 1. Check each subject has at least one assigned teacher
  for (const subject of subjects) {
    const subjectTeachers = teachers.filter(
      (t) => t.subjects?.some((s) => s.toString() === subject._id.toString())
        && t.assignedClasses?.some((c) => c.toString() === classId)
        && t.status === 'active'
    );

    if (subjectTeachers.length === 0) {
      conflicts.push({
        type: 'subject_no_teacher',
        severity: 'error',
        message: `Subject "${subject.name}" (${subject.code}) has no teacher assigned for class ${schoolClass.name} ${section.name}`,
        context: { subjectId: subject._id, subjectName: subject.name },
      });
    }
  }

  // 2. Check total required periods don't exceed available slots
  let totalRequired = 0;
  for (const subject of subjects) {
    totalRequired += subject.weeklyPeriods || 5;
  }
  if (totalRequired > totalWeeklySlots) {
    conflicts.push({
      type: 'periods_exceed_slots',
      severity: 'error',
      message: `Class ${schoolClass.name} ${section.name} requires ${totalRequired} periods/week but only ${totalWeeklySlots} teaching slots are available (${teachingSlotsPerDay}/day × ${workingDays.length} days)`,
      context: { required: totalRequired, available: totalWeeklySlots },
    });
  }

  // 3. Check double-period subjects can fit
  for (const subject of subjects) {
    if (subject.requiresConsecutive) {
      const consecCount = subject.consecutivePeriods || 2;
      const weeklyNeeded = subject.weeklyPeriods || 5;
      const sessionsNeeded = Math.ceil(weeklyNeeded / consecCount);

      // Check if there are enough days with consecutive free slots
      if (sessionsNeeded > workingDays.length) {
        conflicts.push({
          type: 'consecutive_no_fit',
          severity: 'error',
          message: `Subject "${subject.name}" needs ${sessionsNeeded} double-period sessions but only ${workingDays.length} working days available`,
          context: { subjectId: subject._id, sessionsNeeded, daysAvailable: workingDays.length },
        });
      }

      // Check consecutive slots exist within a day
      let canFitConsecutive = false;
      for (let p = 1; p <= periodsPerDay - consecCount + 1; p++) {
        let slotsFree = true;
        for (let i = 0; i < consecCount; i++) {
          if (nonTeachingPeriods.includes(p + i)) {
            slotsFree = false;
            break;
          }
        }
        if (slotsFree) {
          canFitConsecutive = true;
          break;
        }
      }
      if (!canFitConsecutive) {
        conflicts.push({
          type: 'consecutive_blocked',
          severity: 'error',
          message: `Subject "${subject.name}" requires ${consecCount} consecutive periods but lunch/break placements prevent this`,
          context: { subjectId: subject._id, consecCount },
        });
      }
    }
  }

  // 4. Check teacher weekly load capacity
  const teacherTotalLoad = new Map();
  for (const subject of subjects) {
    const subjectTeachers = teachers.filter(
      (t) => t.subjects?.some((s) => s.toString() === subject._id.toString())
        && t.assignedClasses?.some((c) => c.toString() === classId)
    );
    if (subjectTeachers.length === 1) {
      // If only one teacher option, their load is guaranteed
      const tId = subjectTeachers[0]._id.toString();
      teacherTotalLoad.set(tId, (teacherTotalLoad.get(tId) || 0) + (subject.weeklyPeriods || 5));
    }
  }

  for (const [teacherId, load] of teacherTotalLoad) {
    const teacher = teachers.find((t) => t._id.toString() === teacherId);
    if (teacher && load > (teacher.weeklyTeachingLimit || 30)) {
      conflicts.push({
        type: 'teacher_overloaded',
        severity: 'error',
        message: `Teacher "${teacher.firstName} ${teacher.lastName}" is the only option for subjects totaling ${load} periods/week but has a limit of ${teacher.weeklyTeachingLimit || 30}`,
        context: { teacherId, load, limit: teacher.weeklyTeachingLimit || 30 },
      });
    }
  }

  // 5. Check teacher availability covers enough slots
  for (const subject of subjects) {
    const subjectTeachers = teachers.filter(
      (t) => t.subjects?.some((s) => s.toString() === subject._id.toString())
        && t.assignedClasses?.some((c) => c.toString() === classId)
        && t.status === 'active'
    );

    if (subjectTeachers.length === 1) {
      const teacher = subjectTeachers[0];
      const teacherDays = teacher.availableWorkingDays || [1, 2, 3, 4, 5];
      const availableDays = workingDays.filter((d) => teacherDays.includes(d));

      if (availableDays.length === 0) {
        conflicts.push({
          type: 'teacher_no_available_days',
          severity: 'error',
          message: `Teacher "${teacher.firstName} ${teacher.lastName}" (only teacher for "${subject.name}") has no available working days matching the school schedule`,
          context: { teacherId: teacher._id, subjectId: subject._id },
        });
      }

      // Count available slots excluding unavailable periods
      let availableSlots = 0;
      for (const day of availableDays) {
        for (let p = 1; p <= periodsPerDay; p++) {
          if (nonTeachingPeriods.includes(p)) continue;
          const unavail = teacher.unavailablePeriods || [];
          if (!unavail.some((u) => u.day === day && u.periodNo === p)) {
            availableSlots++;
          }
        }
      }

      const needed = subject.weeklyPeriods || 5;
      if (availableSlots < needed) {
        conflicts.push({
          type: 'teacher_insufficient_slots',
          severity: 'warning',
          message: `Teacher "${teacher.firstName} ${teacher.lastName}" has only ${availableSlots} available slots but "${subject.name}" needs ${needed} periods/week`,
          context: { teacherId: teacher._id, subjectId: subject._id, available: availableSlots, needed },
        });
      }
    }
  }

  return { valid: conflicts.filter((c) => c.severity === 'error').length === 0, conflicts };
}

/**
 * Get period numbers that are non-teaching (lunch, break, assembly).
 */
export function getNonTeachingPeriods(config) {
  const nonTeaching = [];

  // Lunch breaks
  if (config.lunchBreaks) {
    for (const lb of config.lunchBreaks) {
      nonTeaching.push(lb.afterPeriod);
    }
  }

  // Period timings with non-teaching types
  if (config.periodTimings) {
    for (const pt of config.periodTimings) {
      if (pt.type !== 'teaching') {
        nonTeaching.push(pt.periodNo);
      }
    }
  }

  return [...new Set(nonTeaching)];
}

/**
 * Validate all class-sections in bulk, checking cross-class teacher conflicts.
 */
export function preValidateBulk({ classSections, teachers, config }) {
  const allConflicts = [];

  // Per-class validation
  for (const cs of classSections) {
    const result = preValidateClassSection({
      schoolClass: cs.schoolClass,
      section: cs.section,
      subjects: cs.subjects,
      teachers,
      config,
    });
    allConflicts.push(...result.conflicts);
  }

  // Cross-class teacher load check
  const teacherCrossLoad = new Map();
  for (const cs of classSections) {
    for (const subject of cs.subjects) {
      const subjectTeachers = teachers.filter(
        (t) => t.subjects?.some((s) => s.toString() === subject._id.toString())
          && t.assignedClasses?.some((c) => c.toString() === cs.schoolClass._id.toString())
      );
      if (subjectTeachers.length === 1) {
        const tId = subjectTeachers[0]._id.toString();
        teacherCrossLoad.set(tId, (teacherCrossLoad.get(tId) || 0) + (subject.weeklyPeriods || 5));
      }
    }
  }

  for (const [teacherId, load] of teacherCrossLoad) {
    const teacher = teachers.find((t) => t._id.toString() === teacherId);
    if (teacher && load > (teacher.weeklyTeachingLimit || 30)) {
      allConflicts.push({
        type: 'teacher_cross_class_overloaded',
        severity: 'error',
        message: `Teacher "${teacher.firstName} ${teacher.lastName}" is exclusively assigned across all classes for ${load} periods/week but has a limit of ${teacher.weeklyTeachingLimit || 30}`,
        context: { teacherId, load, limit: teacher.weeklyTeachingLimit || 30 },
      });
    }
  }

  return {
    valid: allConflicts.filter((c) => c.severity === 'error').length === 0,
    conflicts: allConflicts,
  };
}
