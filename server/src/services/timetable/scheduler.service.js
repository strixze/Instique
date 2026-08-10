/**
 * scheduler.service.js
 * Deterministic timetable generator using backtracking with constraint validation.
 */

import {
  checkTeacherConflict,
  checkClassConflict,
  checkSubjectConstraint,
  checkDailyLimit,
  checkWeeklyLimit,
  checkAvailability
} from './conflict.service.js';

export const scheduleTimetables = (config, classSections, teachers, lockedPeriods, metrics) => {
  const workingDays = config.workingDays || [1, 2, 3, 4, 5];
  const periodsPerDay = config.periodsPerDay || 8;

  // Identify non-teaching periods
  const nonTeachingPeriods = new Set();
  const lunchBreaks = config.lunchBreaks || [];
  lunchBreaks.forEach(lb => {
    if (lb.afterPeriod) nonTeachingPeriods.add(lb.afterPeriod);
  });

  const periodTimings = config.periodTimings || [];
  periodTimings.forEach(pt => {
    if (pt.type !== 'teaching') {
      nonTeachingPeriods.add(pt.periodNo);
    }
  });

  // 1. Initialize In-Memory Data Structures
  const classSchedule = new Map(); // key: `${classId}-${sectionId}-${day}-${period}`, value: { subjectId, teacherId, room, isLunch, isBreak, label }
  const teacherSchedule = new Map(); // key: `${teacherId}-${day}-${period}`, value: { classId, sectionId, className, sectionName }
  const teacherLoad = new Map(); // key: teacherId, value: { weeklyCount, dailyCount: Map<day, count> }
  const subjectRemaining = new Map(); // key: `${classId}-${sectionId}-${subjectId}`, value: remainingCount

  teachers.forEach(t => {
    teacherLoad.set(t._id.toString(), {
      weeklyCount: 0,
      dailyCount: new Map(workingDays.map(d => [d, 0]))
    });
  });

  // Pre-fill non-teaching slots for all class sections
  classSections.forEach(cs => {
    const keyPrefix = `${cs.classId}-${cs.sectionId}`;
    
    // Initialize subjectRemaining
    cs.subjects.forEach(sub => {
      subjectRemaining.set(`${keyPrefix}-${sub._id}`, sub.weeklyPeriods || 5);
    });

    workingDays.forEach(day => {
      for (let p = 1; p <= periodsPerDay; p++) {
        const slotKey = `${keyPrefix}-${day}-${p}`;
        
        // Find if this is a lunch break or custom non-teaching period
        const lunch = lunchBreaks.find(lb => lb.afterPeriod === p);
        const timing = periodTimings.find(pt => pt.periodNo === p);

        if (lunch) {
          classSchedule.set(slotKey, {
            subjectId: null,
            teacherId: null,
            room: '',
            isLunch: true,
            isBreak: false,
            isAssembly: false,
            isFixed: false,
            label: lunch.label || 'Lunch Break'
          });
        } else if (timing && timing.type !== 'teaching') {
          classSchedule.set(slotKey, {
            subjectId: null,
            teacherId: null,
            room: '',
            isLunch: false,
            isBreak: timing.type === 'break',
            isAssembly: timing.type === 'assembly',
            isFixed: timing.type === 'fixed',
            label: timing.label || 'Break'
          });
        }
      }
    });
  });

  // 2. Load Locked Periods from Published Timetables
  lockedPeriods.forEach(lp => {
    const key = `${lp.teacherId}-${lp.day}-${lp.periodNo}`;
    teacherSchedule.set(key, { 
      classId: lp.classId, 
      sectionId: lp.sectionId, 
      className: lp.className, 
      sectionName: lp.sectionName 
    });

    const load = teacherLoad.get(lp.teacherId);
    if (load) {
      load.weeklyCount++;
      load.dailyCount.set(lp.day, (load.dailyCount.get(lp.day) || 0) + 1);
    }

    const classSlotKey = `${lp.classId}-${lp.sectionId}-${lp.day}-${lp.periodNo}`;
    classSchedule.set(classSlotKey, {
      subjectId: lp.subjectId,
      teacherId: lp.teacherId,
      room: lp.room || '',
      isLunch: false,
      isBreak: false,
      isAssembly: false,
      isFixed: false,
      label: ''
    });

    const remainingKey = `${lp.classId}-${lp.sectionId}-${lp.subjectId}`;
    if (subjectRemaining.has(remainingKey)) {
      const current = subjectRemaining.get(remainingKey);
      subjectRemaining.set(remainingKey, Math.max(0, current - 1));
    }
  });

  // 3. Heuristic Sorting
  // Sort class sections: Most constrained (highest total required periods) first
  classSections.sort((a, b) => {
    const aReq = a.subjects.reduce((sum, s) => sum + (s.weeklyPeriods || 5), 0);
    const bReq = b.subjects.reduce((sum, s) => sum + (s.weeklyPeriods || 5), 0);
    if (bReq !== aReq) return bReq - aReq;
    const aName = `${a.schoolClass.name} ${a.section.name}`;
    const bName = `${b.schoolClass.name} ${b.section.name}`;
    return aName.localeCompare(bName);
  });

  // Sort subjects within each class section: Highest weekly periods first
  classSections.forEach(cs => {
    cs.subjects.sort((a, b) => (b.weeklyPeriods || 5) - (a.weeklyPeriods || 5));
  });

  // Helper to sort teachers by lowest workload
  const getSortedTeachersForSubject = (subjectId, classId, currentTeacherLoad) => {
    const qualified = teachers.filter(t => {
      const teachesSubject = t.subjects?.some(s => s.toString() === subjectId.toString());
      const hasClass = !t.assignedClasses || t.assignedClasses.length === 0 || 
                       t.assignedClasses.some(c => c.toString() === classId.toString());
      return teachesSubject && hasClass && t.status === 'active';
    });

    qualified.sort((a, b) => {
      const loadA = currentTeacherLoad.get(a._id.toString())?.weeklyCount || 0;
      const loadB = currentTeacherLoad.get(b._id.toString())?.weeklyCount || 0;
      if (loadA !== loadB) return loadA - loadB;
      return a._id.toString().localeCompare(b._id.toString());
    });

    return qualified;
  };

  // 4. Flatten all teaching slots to be scheduled
  const slotsToSchedule = [];
  classSections.forEach((cs, csIndex) => {
    workingDays.forEach(day => {
      for (let p = 1; p <= periodsPerDay; p++) {
        const slotKey = `${cs.classId}-${cs.sectionId}-${day}-${p}`;
        // Only schedule if it's not pre-occupied (e.g. lunch/break or locked published periods)
        if (!classSchedule.has(slotKey)) {
          slotsToSchedule.push({ csIndex, day, periodNo: p });
        }
      }
    });
  });

  // 5. Backtracking Algorithm
  let statesExplored = 0;
  const maxStates = 80000; // safety limit to prevent hangs

  const solve = (slotIdx) => {
    statesExplored++;
    if (statesExplored > maxStates) return false;

    // Check if all subjects are fully scheduled
    let allDone = true;
    for (const val of subjectRemaining.values()) {
      if (val > 0) {
        allDone = false;
        break;
      }
    }
    if (allDone) return true; // SUCCESS!

    if (slotIdx >= slotsToSchedule.length) return false; // Out of slots but subjects still remain!

    const slot = slotsToSchedule[slotIdx];
    const cs = classSections[slot.csIndex];
    const classSectionKey = `${cs.classId}-${cs.sectionId}`;
    const slotKey = `${classSectionKey}-${slot.day}-${slot.periodNo}`;

    // Try finding a subject for this slot
    for (const sub of cs.subjects) {
      const remainingKey = `${classSectionKey}-${sub._id}`;
      const remaining = subjectRemaining.get(remainingKey) || 0;
      if (remaining <= 0) continue;

      // Check subject max periods per day constraint
      metrics.conflictsChecked++;
      const subDayCheck = checkSubjectConstraint(classSectionKey, sub._id.toString(), slot.day, sub.maxPeriodsPerDay || 2, classSchedule);
      if (!subDayCheck.valid) continue;

      // Handle Consecutive / Double Period Constraint
      const requiresConsecutive = sub.requiresConsecutive && remaining >= 2;
      let consecutiveSlot = null;
      let consecutiveSlotKey = null;

      if (requiresConsecutive) {
        // Look for the next period on the same day in our slotsToSchedule list
        consecutiveSlot = slotsToSchedule.find(s => s.csIndex === slot.csIndex && s.day === slot.day && s.periodNo === slot.periodNo + 1);
        if (consecutiveSlot) {
          consecutiveSlotKey = `${classSectionKey}-${consecutiveSlot.day}-${consecutiveSlot.periodNo}`;
          if (classSchedule.has(consecutiveSlotKey)) {
            // Already occupied
            consecutiveSlot = null;
          }
        }
      }

      // Find sorted qualified teachers
      const sortedTeachers = getSortedTeachersForSubject(sub._id, cs.classId, teacherLoad);

      for (const teacher of sortedTeachers) {
        const teacherId = teacher._id.toString();

        // Validate Teacher constraints
        metrics.conflictsChecked++;
        const availCheck = checkAvailability(teacher, slot.day, slot.periodNo);
        if (!availCheck.valid) continue;

        metrics.conflictsChecked++;
        const teachConflict = checkTeacherConflict(teacherId, slot.day, slot.periodNo, teacherSchedule);
        if (!teachConflict.valid) continue;

        const maxWeekly = teacher.weeklyTeachingLimit || 30;
        metrics.conflictsChecked++;
        const weekCheck = checkWeeklyLimit(teacherId, maxWeekly, teacherLoad);
        if (!weekCheck.valid) continue;

        const maxDaily = teacher.dailyTeachingLimit || 6;
        metrics.conflictsChecked++;
        const dayCheck = checkDailyLimit(teacherId, slot.day, maxDaily, teacherLoad);
        if (!dayCheck.valid) continue;

        // If requiresConsecutive, validate constraints for the consecutive slot too
        if (requiresConsecutive && consecutiveSlot) {
          metrics.conflictsChecked++;
          const availCheck2 = checkAvailability(teacher, consecutiveSlot.day, consecutiveSlot.periodNo);
          if (!availCheck2.valid) continue;

          metrics.conflictsChecked++;
          const teachConflict2 = checkTeacherConflict(teacherId, consecutiveSlot.day, consecutiveSlot.periodNo, teacherSchedule);
          if (!teachConflict2.valid) continue;

          // Double check daily limit permits 2 periods
          const currentDaily = teacherLoad.get(teacherId).dailyCount.get(slot.day) || 0;
          if (currentDaily + 2 > maxDaily) continue;

          // Double check weekly limit permits 2 periods
          const currentWeekly = teacherLoad.get(teacherId).weeklyCount || 0;
          if (currentWeekly + 2 > maxWeekly) continue;
        }

        // --- Assign ---
        const tLoad = teacherLoad.get(teacherId);
        
        // Slot 1
        classSchedule.set(slotKey, {
          subjectId: sub._id.toString(),
          subjectName: sub.name,
          teacherId,
          room: cs.section.roomNo || '',
          isLunch: false,
          isBreak: false,
          isAssembly: false,
          isFixed: false,
          label: ''
        });
        teacherSchedule.set(`${teacherId}-${slot.day}-${slot.periodNo}`, {
          classId: cs.classId,
          sectionId: cs.sectionId,
          className: cs.className,
          sectionName: cs.sectionName
        });
        tLoad.weeklyCount++;
        tLoad.dailyCount.set(slot.day, (tLoad.dailyCount.get(slot.day) || 0) + 1);
        subjectRemaining.set(remainingKey, remaining - 1);

        // Consecutive Slot
        let wasConsecutiveScheduled = false;
        if (requiresConsecutive && consecutiveSlot) {
          classSchedule.set(consecutiveSlotKey, {
            subjectId: sub._id.toString(),
            subjectName: sub.name,
            teacherId,
            room: cs.section.roomNo || '',
            isLunch: false,
            isBreak: false,
            isAssembly: false,
            isFixed: false,
            label: ''
          });
          teacherSchedule.set(`${teacherId}-${consecutiveSlot.day}-${consecutiveSlot.periodNo}`, {
            classId: cs.classId,
            sectionId: cs.sectionId,
            className: cs.className,
            sectionName: cs.sectionName
          });
          tLoad.weeklyCount++;
          tLoad.dailyCount.set(consecutiveSlot.day, (tLoad.dailyCount.get(consecutiveSlot.day) || 0) + 1);
          subjectRemaining.set(remainingKey, remaining - 2);
          wasConsecutiveScheduled = true;
        }

        // Recurse
        const nextSlotIndex = wasConsecutiveScheduled 
          ? slotsToSchedule.findIndex(s => s.csIndex === slot.csIndex && s.day === slot.day && s.periodNo === slot.periodNo + 1) + 1
          : slotIdx + 1;

        const actualNextIndex = (wasConsecutiveScheduled && nextSlotIndex > slotIdx) ? nextSlotIndex : slotIdx + 1;

        if (solve(actualNextIndex)) {
          return true;
        }

        // --- Backtrack / Undo ---
        metrics.backtrackCount++;
        
        // Undo Slot 1
        classSchedule.delete(slotKey);
        teacherSchedule.delete(`${teacherId}-${slot.day}-${slot.periodNo}`);
        tLoad.weeklyCount--;
        tLoad.dailyCount.set(slot.day, tLoad.dailyCount.get(slot.day) - 1);
        subjectRemaining.set(remainingKey, remaining);

        // Undo Consecutive Slot
        if (wasConsecutiveScheduled) {
          classSchedule.delete(consecutiveSlotKey);
          teacherSchedule.delete(`${teacherId}-${consecutiveSlot.day}-${consecutiveSlot.periodNo}`);
          tLoad.weeklyCount--;
          tLoad.dailyCount.set(consecutiveSlot.day, tLoad.dailyCount.get(consecutiveSlot.day) - 1);
        }
      }
    }

    // Try leaving the slot empty
    if (solve(slotIdx + 1)) {
      return true;
    }

    return false;
  };

  const success = solve(0);

  return {
    success: success && statesExplored <= maxStates,
    statesExplored,
    classSchedule,
    workingDays,
    periodsPerDay,
    lunchBreaks,
    periodTimings
  };
};
