import { validatePlacement, consecutivePeriodsFit } from './constraints/HardConstraints.js';
import { calculateSoftScore } from './constraints/SoftConstraints.js';
import { preValidateClassSection } from './PreValidator.js';
import { postValidateTimetable } from './ConflictReporter.js';

export class TimetableEngine {
  constructor({
    schoolClass,
    section,
    subjects,
    teachers,
    config,
    existingTimetable = null,
    globalTeacherSchedule = new Map(), // key: `${teacherId}-${day}-${periodNo}`, value: { classId, sectionId }
    globalRoomSchedule = new Map(),    // key: `${room}-${day}-${periodNo}`, value: { classId, sectionId }
  }) {
    this.schoolClass = schoolClass;
    this.section = section;
    this.subjects = subjects; // Assigned subjects
    this.teachers = teachers; // All teachers in the school
    this.config = config;
    this.existingTimetable = existingTimetable;
    this.globalTeacherSchedule = globalTeacherSchedule;
    this.globalRoomSchedule = globalRoomSchedule;

    // Trackers for current generation run
    this.classGrid = new Map(); // key: `${day}-${periodNo}`, value: period object
    this.teacherDayCounts = new Map(); // key: `${teacherId}-${day}`, value: count
    this.teacherWeeklyCounts = new Map(); // key: teacherId, value: count
    this.teacherDayPeriods = new Map(); // key: `${teacherId}-${day}`, value: Array of periodNo
    this.subjectDayCounts = new Map(); // key: `${subjectId}-${day}`, value: count
    this.subjectWeeklyCounts = new Map(); // key: subjectId, value: count

    this.workingDays = this.config.workingDays || [1, 2, 3, 4, 5];
    this.periodsPerDay = this.config.periodsPerDay || 8;

    // Identify non-teaching periods
    this.nonTeachingPeriods = this.getNonTeachingPeriods();

    // Map of subject id string to subject object
    this.subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));
    // Map of teacher id string to teacher object
    this.teacherMap = new Map(teachers.map((t) => [t._id.toString(), t]));
  }

  getNonTeachingPeriods() {
    const list = [];
    if (this.config.lunchBreaks) {
      for (const lb of this.config.lunchBreaks) {
        list.push(lb.afterPeriod);
      }
    }
    if (this.config.periodTimings) {
      for (const pt of this.config.periodTimings) {
        if (pt.type !== 'teaching') {
          list.push(pt.periodNo);
        }
      }
    }
    return [...new Set(list)];
  }

  /**
   * Pre-fill the class grid with non-teaching periods (lunch, assembly, etc.) and fixed events
   */
  initializeGrid() {
    // 1. Set up all slots for all working days
    for (const day of this.workingDays) {
      for (let p = 1; p <= this.periodsPerDay; p++) {
        const key = `${day}-${p}`;
        const timing = this.config.periodTimings?.find((t) => t.periodNo === p);
        
        // Base period slot
        this.classGrid.set(key, {
          day,
          periodNo: p,
          startTime: timing?.startTime || '',
          endTime: timing?.endTime || '',
          isLunch: false,
          isBreak: false,
          isAssembly: false,
          isFixed: false,
          isLocked: false,
          subject: null,
          teacher: null,
          room: '',
        });
      }
    }

    // 2. Add lunch breaks and non-teaching types from config
    for (const day of this.workingDays) {
      if (this.config.lunchBreaks) {
        for (const lb of this.config.lunchBreaks) {
          const key = `${day}-${lb.afterPeriod}`;
          const slot = this.classGrid.get(key);
          if (slot) {
            slot.isLunch = true;
            slot.label = 'Lunch Break';
          }
        }
      }

      if (this.config.periodTimings) {
        for (const pt of this.config.periodTimings) {
          if (pt.type !== 'teaching') {
            const key = `${day}-${pt.periodNo}`;
            const slot = this.classGrid.get(key);
            if (slot) {
              slot.isLunch = pt.type === 'lunch';
              slot.isBreak = pt.type === 'break';
              slot.isAssembly = pt.type === 'assembly';
              slot.label = pt.label || (pt.type === 'lunch' ? 'Lunch' : pt.type === 'break' ? 'Break' : 'Assembly');
            }
          }
        }
      }

      // Add assemblyConfig if configured for this day
      if (this.config.assemblyConfig?.enabled && this.config.assemblyConfig.days?.includes(day)) {
        const key = `${day}-${this.config.assemblyConfig.periodNo}`;
        const slot = this.classGrid.get(key);
        if (slot) {
          slot.isAssembly = true;
          slot.label = 'Morning Assembly';
        }
      }
    }

    // 3. Add school-wide fixed events
    if (this.config.fixedEvents) {
      for (const ev of this.config.fixedEvents) {
        if (this.workingDays.includes(ev.day)) {
          const key = `${ev.day}-${ev.periodNo}`;
          const slot = this.classGrid.get(key);
          if (slot) {
            slot.isFixed = true;
            slot.label = ev.title;
          }
        }
      }
    }

    // 4. Fill locked slots from existing timetable if provided
    if (this.existingTimetable && this.existingTimetable.periods) {
      const lockedDaysPeriods = new Set(
        (this.existingTimetable.lockedPeriods || []).map((lp) => `${lp.day}-${lp.periodNo}`)
      );

      for (const p of this.existingTimetable.periods) {
        const key = `${p.day}-${p.periodNo}`;
        if (lockedDaysPeriods.has(key)) {
          const slot = this.classGrid.get(key);
          if (slot && !slot.isLunch && !slot.isBreak && !slot.isAssembly && !slot.isFixed) {
            slot.subject = p.subject;
            slot.teacher = p.teacher;
            slot.room = p.room || '';
            slot.isLocked = true;
            slot.label = p.label || '';
            slot.isConsecutiveStart = p.isConsecutiveStart || false;
            slot.consecutiveGroupId = p.consecutiveGroupId || '';

            // Update trackers
            if (p.teacher && p.subject) {
              const teacherIdStr = p.teacher.toString();
              const subjectIdStr = p.subject.toString();

              this.globalTeacherSchedule.set(`${teacherIdStr}-${p.day}-${p.periodNo}`, {
                classId: this.schoolClass._id.toString(),
                sectionId: this.section._id.toString(),
              });
              if (p.room) {
                this.globalRoomSchedule.set(`${p.room}-${p.day}-${p.periodNo}`, {
                  classId: this.schoolClass._id.toString(),
                  sectionId: this.section._id.toString(),
                });
              }

              this.teacherDayCounts.set(`${teacherIdStr}-${p.day}`, (this.teacherDayCounts.get(`${teacherIdStr}-${p.day}`) || 0) + 1);
              this.teacherWeeklyCounts.set(teacherIdStr, (this.teacherWeeklyCounts.get(teacherIdStr) || 0) + 1);

              const teacherDaysArr = this.teacherDayPeriods.get(`${teacherIdStr}-${p.day}`) || [];
              teacherDaysArr.push(p.periodNo);
              this.teacherDayPeriods.set(`${teacherIdStr}-${p.day}`, teacherDaysArr);

              this.subjectDayCounts.set(`${subjectIdStr}-${p.day}`, (this.subjectDayCounts.get(`${subjectIdStr}-${p.day}`) || 0) + 1);
              this.subjectWeeklyCounts.set(subjectIdStr, (this.subjectWeeklyCounts.get(subjectIdStr) || 0) + 1);
            }
          }
        }
      }
    }
  }

  /**
   * Run pre-validation and generate the timetable using constraint-based backtracking search.
   * Returns { success: boolean, periods: Array, conflicts: Array }
   */
  generate() {
    // 1. Pre-validation
    const preVal = preValidateClassSection({
      schoolClass: this.schoolClass,
      section: this.section,
      subjects: this.subjects,
      teachers: this.teachers,
      config: this.config,
    });

    if (!preVal.valid) {
      return {
        success: false,
        periods: [],
        conflicts: preVal.conflicts,
      };
    }

    // 2. Initialize Grid
    this.initializeGrid();

    // 3. Prepare list of subject requirements to place
    // We order them by weeklyPeriods descending (most constrained first) and double-period first
    const requirements = [];
    for (const subject of this.subjects) {
      const subjectIdStr = subject._id.toString();
      const currentPlaced = this.subjectWeeklyCounts.get(subjectIdStr) || 0;
      let remaining = (subject.weeklyPeriods || 5) - currentPlaced;

      if (remaining <= 0) continue;

      if (subject.requiresConsecutive) {
        const consecCount = subject.consecutivePeriods || 2;
        while (remaining >= consecCount) {
          requirements.push({
            subject,
            count: consecCount,
            isConsecutive: true,
          });
          remaining -= consecCount;
        }
      }
      // Put remaining as single periods
      for (let i = 0; i < remaining; i++) {
        requirements.push({
          subject,
          count: 1,
          isConsecutive: false,
        });
      }
    }

    // Sort requirements: double periods first, then by weekly required desc
    requirements.sort((a, b) => {
      if (a.isConsecutive && !b.isConsecutive) return -1;
      if (!a.isConsecutive && b.isConsecutive) return 1;
      return (b.subject.weeklyPeriods || 5) - (a.subject.weeklyPeriods || 5);
    });

    // 4. Backtracking search to assign requirements to empty slots
    let statesExplored = 0;
    const maxStates = 15000; // safety limit to prevent infinite loops on hard configs

    const backtrack = (reqIndex) => {
      statesExplored++;
      if (statesExplored > maxStates) return false;
      if (reqIndex >= requirements.length) return true; // all requirements successfully placed!

      const req = requirements[reqIndex];
      const subjectIdStr = req.subject._id.toString();

      // Find available teachers for this subject
      const subjectTeachers = this.teachers.filter(
        (t) => t.subjects?.some((s) => s.toString() === subjectIdStr)
          && (!t.assignedClasses?.length || t.assignedClasses.some((c) => c.toString() === this.schoolClass._id.toString()))
          && t.status === 'active'
      );

      // Find valid placements (slots + teacher combinations)
      const candidates = [];

      for (const day of this.workingDays) {
        const teacherDaysLimit = this.workingDays;
        
        for (let p = 1; p <= this.periodsPerDay; p++) {
          const key = `${day}-${p}`;
          const slot = this.classGrid.get(key);

          // Slot must be empty, not lunch, break, assembly, or fixed
          if (!slot || slot.subject || slot.isLunch || slot.isBreak || slot.isAssembly || slot.isFixed) {
            continue;
          }

          // If consecutive, check if consecutive slots fit in this day
          if (req.isConsecutive) {
            if (!consecutivePeriodsFit(this.classGrid, day, p, req.count, this.periodsPerDay, this.nonTeachingPeriods)) {
              continue;
            }
          }

          // Check teacher combinations
          for (const teacher of subjectTeachers) {
            const teacherIdStr = teacher._id.toString();
            const room = req.subject.labRequired || this.section.roomNo || '';

            // Run hard constraints for this slot
            let allSlotsValid = true;
            const tempViolations = [];

            for (let offset = 0; offset < req.count; offset++) {
              const currentPeriod = p + offset;

              const check = validatePlacement({
                globalTeacherSchedule: this.globalTeacherSchedule,
                teacherDayCounts: this.teacherDayCounts,
                teacherWeeklyCounts: this.teacherWeeklyCounts,
                classGrid: this.classGrid,
                subjectDayCounts: this.subjectDayCounts,
                globalRoomSchedule: this.globalRoomSchedule,
                teacher,
                subjectId: req.subject._id,
                classId: this.schoolClass._id,
                day,
                periodNo: currentPeriod,
                room,
              });

              if (!check.valid) {
                allSlotsValid = false;
                tempViolations.push(...check.violations);
                break;
              }
            }

            if (allSlotsValid) {
              // Calculate soft score
              let softScoreSum = 0;
              for (let offset = 0; offset < req.count; offset++) {
                softScoreSum += calculateSoftScore({
                  teacherDayCounts: this.teacherDayCounts,
                  teacherDayPeriods: this.teacherDayPeriods,
                  subjectDayCounts: this.subjectDayCounts,
                  teacher,
                  subject: req.subject,
                  day,
                  periodNo: p + offset,
                  workingDays: this.workingDays,
                });
              }

              candidates.push({
                day,
                periodNo: p,
                teacher,
                room,
                score: softScoreSum,
              });
            }
          }
        }
      }

      // Sort candidates by soft score descending
      candidates.sort((a, b) => b.score - a.score);

      // Try placing candidates
      for (const cand of candidates) {
        const groupId = req.isConsecutive ? `consec-${cand.day}-${cand.periodNo}-${Math.random().toString(36).substr(2, 5)}` : '';

        // Apply placement
        for (let offset = 0; offset < req.count; offset++) {
          const currPeriod = cand.periodNo + offset;
          const k = `${cand.day}-${currPeriod}`;
          const s = this.classGrid.get(k);

          s.subject = req.subject._id;
          s.teacher = cand.teacher._id;
          s.room = cand.room;
          s.isConsecutiveStart = req.isConsecutive && offset === 0;
          s.consecutiveGroupId = groupId;

          const teacherIdStr = cand.teacher._id.toString();
          const subjectIdStr = req.subject._id.toString();

          this.globalTeacherSchedule.set(`${teacherIdStr}-${cand.day}-${currPeriod}`, {
            classId: this.schoolClass._id.toString(),
            sectionId: this.section._id.toString(),
          });
          if (cand.room) {
            this.globalRoomSchedule.set(`${cand.room}-${cand.day}-${currPeriod}`, {
              classId: this.schoolClass._id.toString(),
              sectionId: this.section._id.toString(),
            });
          }

          this.teacherDayCounts.set(`${teacherIdStr}-${cand.day}`, (this.teacherDayCounts.get(`${teacherIdStr}-${cand.day}`) || 0) + 1);
          this.teacherWeeklyCounts.set(teacherIdStr, (this.teacherWeeklyCounts.get(teacherIdStr) || 0) + 1);

          const teacherDaysArr = this.teacherDayPeriods.get(`${teacherIdStr}-${cand.day}`) || [];
          teacherDaysArr.push(currPeriod);
          this.teacherDayPeriods.set(`${teacherIdStr}-${cand.day}`, teacherDaysArr);

          this.subjectDayCounts.set(`${subjectIdStr}-${cand.day}`, (this.subjectDayCounts.get(`${subjectIdStr}-${cand.day}`) || 0) + 1);
          this.subjectWeeklyCounts.set(subjectIdStr, (this.subjectWeeklyCounts.get(subjectIdStr) || 0) + 1);
        }

        // Recurse
        if (backtrack(reqIndex + 1)) {
          return true;
        }

        // Backtrack: Remove placement
        for (let offset = 0; offset < req.count; offset++) {
          const currPeriod = cand.periodNo + offset;
          const k = `${cand.day}-${currPeriod}`;
          const s = this.classGrid.get(k);

          s.subject = null;
          s.teacher = null;
          s.room = '';
          s.isConsecutiveStart = false;
          s.consecutiveGroupId = '';

          const teacherIdStr = cand.teacher._id.toString();
          const subjectIdStr = req.subject._id.toString();

          this.globalTeacherSchedule.delete(`${teacherIdStr}-${cand.day}-${currPeriod}`);
          if (cand.room) {
            this.globalRoomSchedule.delete(`${cand.room}-${cand.day}-${currPeriod}`);
          }

          this.teacherDayCounts.set(`${teacherIdStr}-${cand.day}`, Math.max(0, (this.teacherDayCounts.get(`${teacherIdStr}-${cand.day}`) || 0) - 1));
          this.teacherWeeklyCounts.set(teacherIdStr, Math.max(0, (this.teacherWeeklyCounts.get(teacherIdStr) || 0) - 1));

          const teacherDaysArr = this.teacherDayPeriods.get(`${teacherIdStr}-${cand.day}`) || [];
          const idx = teacherDaysArr.indexOf(currPeriod);
          if (idx > -1) teacherDaysArr.splice(idx, 1);
          this.teacherDayPeriods.set(`${teacherIdStr}-${cand.day}`, teacherDaysArr);

          this.subjectDayCounts.set(`${subjectIdStr}-${cand.day}`, Math.max(0, (this.subjectDayCounts.get(`${subjectIdStr}-${cand.day}`) || 0) - 1));
          this.subjectWeeklyCounts.set(subjectIdStr, Math.max(0, (this.subjectWeeklyCounts.get(subjectIdStr) || 0) - 1));
        }
      }

      return false; // could not place this requirement in any valid configuration
    };

    const searchSuccess = backtrack(0);

    // 5. Convert grid back to a flat array of periods
    const finalPeriods = Array.from(this.classGrid.values());

    // 6. Post-generation validation to check for any errors/warnings
    const postConflicts = postValidateTimetable(finalPeriods, this.teachers, this.subjects, this.config);

    if (!searchSuccess) {
      // Find missing requirements
      const missing = [];
      for (const req of requirements) {
        const count = finalPeriods.filter((p) => p.subject?.toString() === req.subject._id.toString()).length;
        const required = req.subject.weeklyPeriods || 5;
        if (count < required) {
          missing.push(req.subject.name);
        }
      }
      const uniqueMissing = [...new Set(missing)];

      postConflicts.push({
        type: 'generation_incomplete',
        severity: 'error',
        message: `Could not place all subject periods automatically. Missing: ${uniqueMissing.join(', ')}. Try modifying constraints or teacher availability.`,
        context: { uniqueMissing },
      });
    }

    return {
      success: searchSuccess && postConflicts.filter((c) => c.severity === 'error').length === 0,
      periods: finalPeriods,
      conflicts: postConflicts,
    };
  }
}
