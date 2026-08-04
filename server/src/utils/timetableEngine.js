export class TimetableGenerator {
  constructor({ schoolClass, section, subjects, teachers, periodsPerDay, lunchAfter, workingDays, holidays, teacherPreferences, subjectWeeklyLimits }) {
    this.schoolClass = schoolClass;
    this.section = section;
    this.subjects = subjects;
    this.teachers = teachers;
    this.periodsPerDay = periodsPerDay || 8;
    this.lunchAfter = lunchAfter || 4;
    this.workingDays = workingDays || [1, 2, 3, 4, 5];
    this.holidays = holidays || [];
    this.teacherPreferences = teacherPreferences || {};
    this.subjectWeeklyLimits = subjectWeeklyLimits || {};

    this.timetable = [];
    this.teacherSlots = {};
    this.subjectCounts = {};
    this.teacherDayPeriods = {};
  }

  generate() {
    for (const day of this.workingDays) {
      if (this.holidays.includes(day)) continue;

      const dayPeriods = [];
      let periodNo = 0;

      for (let p = 0; p < this.periodsPerDay; p++) {
        periodNo++;
        if (periodNo === this.lunchAfter) {
          dayPeriods.push({ day, periodNo, isLunch: true, isBreak: false });
          continue;
        }

        const assigned = this.assignPeriod(day, periodNo);
        if (assigned) {
          dayPeriods.push(assigned);
        } else {
          dayPeriods.push({ day, periodNo, isLunch: false, isBreak: true });
        }
      }

      this.timetable.push(...dayPeriods);
    }

    return this.timetable;
  }

  getTeachersForSubject(subjectId) {
    const sid = subjectId.toString();
    return this.teachers.filter((t) =>
      t.subjects?.some((s) => s.toString() === sid)
    );
  }

  assignPeriod(day, periodNo) {
    const availableSubjects = this.subjects.filter((s) => {
      const weeklyLimit = this.subjectWeeklyLimits[s._id.toString()] || s.weeklyPeriods || 5;
      const currentCount = this.subjectCounts[s._id.toString()] || 0;
      return currentCount < weeklyLimit;
    });

    const scored = [];

    for (const subject of availableSubjects) {
      const candidateTeachers = this.getTeachersForSubject(subject._id);

      for (const teacher of candidateTeachers) {
        const teacherKey = teacher._id.toString();
        const daySlotKey = `${teacherKey}-${day}`;
        const daySlots = this.teacherSlots[daySlotKey] || 0;
        const maxPerDay = 6;

        if (daySlots >= maxPerDay) continue;

        const periodKey = `${teacherKey}-${day}-${periodNo}`;
        if (this.teacherDayPeriods[periodKey]) continue;

        let score = 0;

        if (this.teacherPreferences[teacherKey]?.preferredDays?.includes(day)) score += 3;
        if (this.teacherPreferences[teacherKey]?.preferredPeriods?.includes(periodNo)) score += 2;

        score -= daySlots * 0.5;

        scored.push({ subject, teacher, score });
      }
    }

    const valid = scored.filter((s) => s.teacher && s.score >= 0);
    if (valid.length === 0) return null;

    valid.sort((a, b) => b.score - a.score);

    const best = valid[0];
    const teacherKey = best.teacher._id.toString();
    this.teacherSlots[`${teacherKey}-${day}`] = (this.teacherSlots[`${teacherKey}-${day}`] || 0) + 1;
    this.teacherDayPeriods[`${teacherKey}-${day}-${periodNo}`] = true;
    this.subjectCounts[best.subject._id.toString()] = (this.subjectCounts[best.subject._id.toString()] || 0) + 1;

    return {
      day,
      periodNo,
      subject: best.subject._id,
      teacher: best.teacher._id,
      room: '',
      isLunch: false,
      isBreak: false,
    };
  }

  validate() {
    const conflicts = [];
    const teacherDayPeriod = {};
    const subjectDayPeriod = {};

    for (const p of this.timetable) {
      if (p.isLunch || p.isBreak) continue;

      if (p.teacher) {
        const tKey = `${p.teacher.toString()}-${p.day}-${p.periodNo}`;
        if (teacherDayPeriod[tKey]) {
          conflicts.push({ type: 'teacher_double_booked', period: p, existing: teacherDayPeriod[tKey] });
        } else {
          teacherDayPeriod[tKey] = p;
        }
      }

      if (p.subject) {
        const sKey = `${p.subject.toString()}-${p.day}-${p.periodNo}`;
        if (subjectDayPeriod[sKey]) {
          conflicts.push({ type: 'subject_double_booked', period: p, existing: subjectDayPeriod[sKey] });
        } else {
          subjectDayPeriod[sKey] = p;
        }
      }
    }

    const teacherDayCount = {};
    for (const p of this.timetable) {
      if (p.isLunch || p.isBreak || !p.teacher) continue;
      const tKey = `${p.teacher.toString()}-${p.day}`;
      teacherDayCount[tKey] = (teacherDayCount[tKey] || 0) + 1;
    }
    for (const [key, count] of Object.entries(teacherDayCount)) {
      if (count > 6) {
        conflicts.push({ type: 'teacher_overloaded', teacher: key.split('-')[0], day: parseInt(key.split('-')[1]), count });
      }
    }

    return conflicts;
  }

  static detectConflicts(periods) {
    const conflicts = [];

    const teacherDayPeriod = {};
    const roomDayPeriod = {};

    for (const p of periods) {
      if (p.isLunch || p.isBreak) continue;

      if (p.teacher) {
        const key = `${p.teacher.toString()}-${p.day}-${p.periodNo}`;
        if (teacherDayPeriod[key]) {
          conflicts.push({ type: 'teacher_double_booked', period: p, existing: teacherDayPeriod[key] });
        } else {
          teacherDayPeriod[key] = p;
        }
      }

      if (p.room) {
        const key = `${p.room}-${p.day}-${p.periodNo}`;
        if (roomDayPeriod[key]) {
          conflicts.push({ type: 'room_double_booked', period: p, existing: roomDayPeriod[key] });
        } else {
          roomDayPeriod[key] = p;
        }
      }
    }

    return conflicts;
  }
}
