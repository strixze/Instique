/**
 * validator.service.js
 * Validates school config, classes, sections, subjects, and teachers before generation.
 */

export const validateSchedulingData = (config, classes, teachers, subjects, classSections) => {
  const errors = [];

  // --- 1. School Validation ---
  const workingDays = config.workingDays || [];
  if (workingDays.length === 0) {
    errors.push({
      type: "INVALID_CONFIG",
      message: "School configuration has no working days configured."
    });
  }

  const periodsPerDay = config.periodsPerDay || 0;
  if (periodsPerDay <= 0) {
    errors.push({
      type: "INVALID_CONFIG",
      message: "School configuration has invalid number of periods per day."
    });
  }

  const lunchBreaks = config.lunchBreaks || [];
  const nonTeachingPeriods = new Set();
  lunchBreaks.forEach(lb => {
    if (lb.afterPeriod) nonTeachingPeriods.add(lb.afterPeriod);
  });

  const periodTimings = config.periodTimings || [];
  periodTimings.forEach(pt => {
    if (pt.type !== 'teaching') {
      nonTeachingPeriods.add(pt.periodNo);
    }
  });

  const teachingSlotsPerDay = periodsPerDay - nonTeachingPeriods.size;
  const totalWeeklySlots = teachingSlotsPerDay * workingDays.length;

  if (totalWeeklySlots <= 0) {
    errors.push({
      type: "INVALID_CONFIG",
      message: "School configuration has 0 available teaching slots per week."
    });
  }

  // --- 2. Class & Section & Subject Validation ---
  if (classes.length === 0) {
    errors.push({
      type: "MISSING_CLASSES",
      message: "No classes found for the selected academic year."
    });
  }

  classes.forEach(classObj => {
    const classId = classObj._id.toString();
    if (!classObj.sections || classObj.sections.length === 0) {
      errors.push({
        type: "MISSING_SECTIONS",
        message: `Class "${classObj.name}" has no sections defined.`
      });
    }

    if (!classObj.subjects || classObj.subjects.length === 0) {
      errors.push({
        type: "MISSING_SUBJECTS",
        message: `Class "${classObj.name}" has no subjects assigned.`
      });
    } else {
      // Check subject details
      let totalRequiredPeriods = 0;
      const classSubjects = subjects.filter(sub => classObj.subjects.some(id => id.toString() === sub._id.toString()));

      classSubjects.forEach(sub => {
        const weeklyPeriods = sub.weeklyPeriods || 5;
        totalRequiredPeriods += weeklyPeriods;

        if (weeklyPeriods <= 0) {
          errors.push({
            type: "INVALID_SUBJECT",
            message: `Subject "${sub.name}" in class "${classObj.name}" must have weekly periods greater than 0.`
          });
        }

        const maxPeriodsPerDay = sub.maxPeriodsPerDay || 2;
        if (maxPeriodsPerDay <= 0) {
          errors.push({
            type: "INVALID_SUBJECT",
            message: `Subject "${sub.name}" in class "${classObj.name}" has invalid max periods per day (${maxPeriodsPerDay}).`
          });
        }

        if (sub.requiresConsecutive) {
          const consec = sub.consecutivePeriods || 2;
          if (consec > teachingSlotsPerDay) {
            errors.push({
              type: "INVALID_SUBJECT",
              message: `Subject "${sub.name}" requires ${consec} consecutive periods, but only ${teachingSlotsPerDay} teaching slots exist per day.`
            });
          }
        }
      });

      if (totalRequiredPeriods > totalWeeklySlots) {
        errors.push({
          type: "SLOTS_OVERFLOW",
          message: `Class "${classObj.name}" requires ${totalRequiredPeriods} periods/week, but only ${totalWeeklySlots} weekly slots are available.`
        });
      }
    }
  });

  // --- 3. Teacher Validation ---
  if (teachers.length === 0) {
    errors.push({
      type: "MISSING_TEACHERS",
      message: "No active teachers found in the system."
    });
  }

  // Map to track teacher weekly qualified load
  const teacherMaxCapacity = new Map();
  teachers.forEach(t => {
    teacherMaxCapacity.set(t._id.toString(), t.weeklyTeachingLimit || 30);
  });

  // Check subject-teacher mapping per class section
  classSections.forEach(cs => {
    const classId = cs.schoolClass._id.toString();
    const className = cs.schoolClass.name;
    const sectionName = cs.section.name;

    cs.subjects.forEach(sub => {
      // Find qualified teachers who teach this subject and are assigned to this class
      // Note: If no classes are explicitly assigned, the teacher is eligible for any class
      const qualifiedTeachers = teachers.filter(t => {
        const teachesSubject = t.subjects?.some(s => s.toString() === sub._id.toString());
        const hasClass = !t.assignedClasses || t.assignedClasses.length === 0 || 
                         t.assignedClasses.some(c => c.toString() === classId);
        return teachesSubject && hasClass && t.status === 'active';
      });

      if (qualifiedTeachers.length === 0) {
        errors.push({
          type: "MISSING_TEACHER",
          message: `Subject "${sub.name}" (${sub.code}) has no qualified teacher assigned for class ${className} ${sectionName}.`
        });
      }
    });
  });

  return {
    success: errors.length === 0,
    message: errors.length === 0 ? "Validation successful" : "Validation failed",
    errors
  };
};
