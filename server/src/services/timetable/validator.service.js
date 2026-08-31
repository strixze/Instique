/**
 * validator.service.js
 * Validates school config, classes, sections, subjects, and teachers before generation.
 * Only checks for truly critical issues (missing data), NOT capacity limits.
 */

export const validateSchedulingData = (config, classes, teachers, subjects, classSections) => {
  const errors = [];

  // --- 1. School Configuration Validation ---
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
    }
  });

  // --- 3. Teacher Validation ---
  if (teachers.length === 0) {
    errors.push({
      type: "MISSING_TEACHERS",
      message: "No active teachers found in the system. Timetable requires at least one active teacher."
    });
  }

  // Check subject-teacher mapping per class section
  classSections.forEach(cs => {
    const classId = cs.schoolClass._id.toString();
    const className = cs.schoolClass.name;
    const sectionName = cs.section.name;

    cs.subjects.forEach(sub => {
      const qualifiedTeachers = teachers.filter(t => {
        const teachesSubject = t.subjects?.some(s => s.toString() === sub._id.toString());
        const hasClass = !t.assignedClasses || t.assignedClasses.length === 0 || 
                         t.assignedClasses.some(c => c.toString() === classId);
        return teachesSubject && hasClass && t.status === 'active';
      });

      if (qualifiedTeachers.length === 0) {
        errors.push({
          type: "MISSING_TEACHER",
          message: `Subject "${sub.name}" (${sub.code}) has no qualified teacher assigned for class ${className} ${sectionName}. At least 1 active teacher must have this subject in their profile.`
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
