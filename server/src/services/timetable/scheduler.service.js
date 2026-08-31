/**
 * scheduler.service.js
 * Greedy round-robin timetable generator.
 * 
 * Design:
 * - Fills ALL available teaching slots with subjects distributed evenly
 * - Assigns the least-loaded qualified teacher for each slot
 * - Schedules all sections of a class simultaneously to prevent teacher overlaps
 * - No backtracking — deterministic greedy fill
 * - Does NOT enforce weeklyPeriods, weeklyTeachingLimit, or dailyTeachingLimit
 */

import {
  checkTeacherConflict,
  checkAvailability
} from './conflict.service.js';

export const scheduleTimetables = (config, classSections, teachers, lockedPeriods, metrics) => {
  const workingDays = config.workingDays || [1, 2, 3, 4, 5, 6];
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
  const classSchedule = new Map();
  const teacherSchedule = new Map();
  const teacherLoad = new Map();

  teachers.forEach(t => {
    teacherLoad.set(t._id.toString(), {
      weeklyCount: 0,
      dailyCount: new Map(workingDays.map(d => [d, 0]))
    });
  });

  // Pre-fill non-teaching slots (lunch, break, assembly) for all class sections
  classSections.forEach(cs => {
    const keyPrefix = `${cs.classId}-${cs.sectionId}`;

    workingDays.forEach(day => {
      for (let p = 1; p <= periodsPerDay; p++) {
        const slotKey = `${keyPrefix}-${day}-${p}`;

        const lunch = lunchBreaks.find(lb => lb.afterPeriod === p);
        const timing = periodTimings.find(pt => pt.periodNo === p);

        if (lunch) {
          classSchedule.set(slotKey, {
            subjectId: null, teacherId: null, room: '',
            isLunch: true, isBreak: false, isAssembly: false, isFixed: false,
            label: lunch.label || 'Lunch Break'
          });
        } else if (timing && timing.type !== 'teaching') {
          classSchedule.set(slotKey, {
            subjectId: null, teacherId: null, room: '',
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
      classId: lp.classId, sectionId: lp.sectionId,
      className: lp.className, sectionName: lp.sectionName
    });

    const load = teacherLoad.get(lp.teacherId);
    if (load) {
      load.weeklyCount++;
      load.dailyCount.set(lp.day, (load.dailyCount.get(lp.day) || 0) + 1);
    }

    const classSlotKey = `${lp.classId}-${lp.sectionId}-${lp.day}-${lp.periodNo}`;
    classSchedule.set(classSlotKey, {
      subjectId: lp.subjectId, teacherId: lp.teacherId, room: lp.room || '',
      isLunch: false, isBreak: false, isAssembly: false, isFixed: false, label: ''
    });
  });

  // 3. Compute teaching slots — ordered list of (day, periodNo)
  const teachingSlots = [];
  workingDays.forEach(day => {
    for (let p = 1; p <= periodsPerDay; p++) {
      if (!nonTeachingPeriods.has(p)) {
        teachingSlots.push({ day, periodNo: p });
      }
    }
  });

  const totalTeachingSlots = teachingSlots.length;

  // 4. Build subject round-robin sequence for a class-section
  const buildSubjectSequence = (subjects) => {
    if (subjects.length === 0) return [];

    const slotsPerSubject = Math.floor(totalTeachingSlots / subjects.length);
    const remainder = totalTeachingSlots % subjects.length;

    // Build buckets
    const subjectBuckets = subjects.map((sub, idx) => ({
      subject: sub,
      remaining: slotsPerSubject + (idx < remainder ? 1 : 0)
    }));

    // Round-robin interleave: pick one from each bucket in turn
    const interleaved = [];
    let placed = 0;
    while (placed < totalTeachingSlots) {
      for (const bucket of subjectBuckets) {
        if (bucket.remaining > 0 && placed < totalTeachingSlots) {
          interleaved.push(bucket.subject);
          bucket.remaining--;
          placed++;
        }
      }
    }

    return interleaved;
  };

  // Helper to find the least-loaded qualified teacher for a subject+class at a timeslot
  const findBestTeacher = (subjectId, classId, day, periodNo) => {
    const qualified = teachers.filter(t => {
      const teachesSubject = t.subjects?.some(s => s.toString() === subjectId.toString());
      const hasClass = !t.assignedClasses || t.assignedClasses.length === 0 ||
                       t.assignedClasses.some(c => c.toString() === classId.toString());
      return teachesSubject && hasClass && t.status === 'active';
    });

    // Sort by lowest weekly load, then by lowest daily load for this day
    qualified.sort((a, b) => {
      const loadA = teacherLoad.get(a._id.toString());
      const loadB = teacherLoad.get(b._id.toString());
      const weeklyA = loadA?.weeklyCount || 0;
      const weeklyB = loadB?.weeklyCount || 0;
      if (weeklyA !== weeklyB) return weeklyA - weeklyB;
      const dailyA = loadA?.dailyCount?.get(day) || 0;
      const dailyB = loadB?.dailyCount?.get(day) || 0;
      return dailyA - dailyB;
    });

    // Pick the first teacher that passes conflict checks
    for (const teacher of qualified) {
      const teacherId = teacher._id.toString();
      metrics.conflictsChecked++;

      const availCheck = checkAvailability(teacher, day, periodNo);
      if (!availCheck.valid) continue;

      metrics.conflictsChecked++;
      const conflictCheck = checkTeacherConflict(teacherId, day, periodNo, teacherSchedule);
      if (!conflictCheck.valid) continue;

      return teacher;
    }

    return null;
  };

  // 5. Group classSections by classId so we schedule all sections of a class together
  const classSectionGroups = new Map();
  classSections.forEach(cs => {
    if (!classSectionGroups.has(cs.classId)) {
      classSectionGroups.set(cs.classId, []);
    }
    classSectionGroups.get(cs.classId).push(cs);
  });

  // 6. Schedule each class group
  let totalScheduled = 0;
  let totalSlots = 0;

  for (const [classId, sections] of classSectionGroups) {
    const sectionSequences = sections.map(cs => ({
      cs,
      sequence: buildSubjectSequence(cs.subjects),
      keyPrefix: `${cs.classId}-${cs.sectionId}`
    }));

    // For each teaching slot, schedule ALL sections simultaneously
    for (let slotIdx = 0; slotIdx < teachingSlots.length; slotIdx++) {
      const { day, periodNo } = teachingSlots[slotIdx];

      for (const sec of sectionSequences) {
        const slotKey = `${sec.keyPrefix}-${day}-${periodNo}`;

        // Skip if already occupied
        if (classSchedule.has(slotKey)) continue;

        totalSlots++;

        const subject = sec.sequence[slotIdx];
        if (!subject) continue;

        const teacher = findBestTeacher(subject._id, sec.cs.classId, day, periodNo);

        if (teacher) {
          const teacherId = teacher._id.toString();

          classSchedule.set(slotKey, {
            subjectId: subject._id.toString(),
            subjectName: subject.name,
            teacherId,
            room: sec.cs.section.roomNo || '',
            isLunch: false, isBreak: false, isAssembly: false, isFixed: false,
            label: ''
          });

          teacherSchedule.set(`${teacherId}-${day}-${periodNo}`, {
            classId: sec.cs.classId,
            sectionId: sec.cs.sectionId,
            className: sec.cs.className,
            sectionName: sec.cs.sectionName
          });

          const tLoad = teacherLoad.get(teacherId);
          tLoad.weeklyCount++;
          tLoad.dailyCount.set(day, (tLoad.dailyCount.get(day) || 0) + 1);

          totalScheduled++;
        }
      }
    }
  }

  console.log(`[Scheduler] Scheduled ${totalScheduled}/${totalSlots} teaching slots`);

  return {
    success: true,
    statesExplored: metrics.conflictsChecked,
    classSchedule,
    workingDays,
    periodsPerDay,
    lunchBreaks,
    periodTimings
  };
};
