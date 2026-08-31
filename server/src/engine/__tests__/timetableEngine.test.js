import { teacherNoDoubleBooking, teacherOnlyAssignedSubjects, teacherOnlyAssignedClasses, teacherAvailableOnDay, teacherNotUnavailable, teacherDailyLimit, teacherWeeklyLimit, classNoDoubleBooking, subjectMaxPerDay, consecutivePeriodsFit, roomNoDoubleBooking } from '../constraints/HardConstraints.js';
import { calculateSoftScore } from '../constraints/SoftConstraints.js';
import { preValidateClassSection } from '../PreValidator.js';
import { TimetableEngine } from '../TimetableEngine.js';

describe('Timetable Engine Unit Tests', () => {
  // Mock Data
  const mockTeacher = {
    _id: 'teacher-1',
    firstName: 'John',
    lastName: 'Doe',
    subjects: ['subj-1', 'subj-2'],
    assignedClasses: ['class-1'],
    availableWorkingDays: [1, 2, 3, 4, 5],
    unavailablePeriods: [{ day: 1, periodNo: 3 }],
    weeklyTeachingLimit: 10,
    dailyTeachingLimit: 3,
    status: 'active',
  };

  const mockSubject = {
    _id: 'subj-1',
    name: 'Mathematics',
    code: 'MATH101',
    weeklyPeriods: 4,
    maxPeriodsPerDay: 2,
    isPractical: false,
    requiresConsecutive: false,
    category: 'academic',
  };

  const mockClass = {
    _id: 'class-1',
    name: 'Grade 10',
  };

  const mockSection = {
    _id: 'sec-1',
    name: 'A',
    roomNo: 'Room-101',
  };

  const mockConfig = {
    workingDays: [1, 2, 3, 4, 5],
    periodsPerDay: 6,
    periodTimings: [
      { periodNo: 1, startTime: '08:00', endTime: '08:45', type: 'teaching' },
      { periodNo: 2, startTime: '08:45', endTime: '09:30', type: 'teaching' },
      { periodNo: 3, startTime: '09:30', endTime: '10:15', type: 'lunch' },
      { periodNo: 4, startTime: '10:15', endTime: '11:00', type: 'teaching' },
      { periodNo: 5, startTime: '11:00', endTime: '11:45', type: 'teaching' },
      { periodNo: 6, startTime: '11:45', endTime: '12:30', type: 'teaching' },
    ],
    lunchBreaks: [{ afterPeriod: 3, durationMinutes: 45 }],
  };

  describe('Hard Constraints Tests', () => {
    test('teacherNoDoubleBooking should detect conflicts correctly', () => {
      const schedule = new Map();
      schedule.set('teacher-1-1-1', { classId: 'other-class', sectionId: 'other-sec' });
      expect(teacherNoDoubleBooking(schedule, 'teacher-1', 1, 1)).toBe(false);
      expect(teacherNoDoubleBooking(schedule, 'teacher-1', 1, 2)).toBe(true);
    });

    test('teacherOnlyAssignedSubjects validation', () => {
      expect(teacherOnlyAssignedSubjects(mockTeacher, 'subj-1')).toBe(true);
      expect(teacherOnlyAssignedSubjects(mockTeacher, 'subj-3')).toBe(false);
    });

    test('teacherOnlyAssignedClasses validation', () => {
      expect(teacherOnlyAssignedClasses(mockTeacher, 'class-1')).toBe(true);
      expect(teacherOnlyAssignedClasses(mockTeacher, 'class-2')).toBe(false);
    });

    test('teacherAvailableOnDay validation', () => {
      expect(teacherAvailableOnDay(mockTeacher, 1)).toBe(true);
      expect(teacherAvailableOnDay({ ...mockTeacher, availableWorkingDays: [1, 2] }, 3)).toBe(false);
    });

    test('teacherNotUnavailable validation', () => {
      expect(teacherNotUnavailable(mockTeacher, 1, 3)).toBe(false);
      expect(teacherNotUnavailable(mockTeacher, 1, 2)).toBe(true);
    });

    test('teacherDailyLimit validation', () => {
      const dayCounts = new Map();
      dayCounts.set('teacher-1-1', 2);
      expect(teacherDailyLimit(dayCounts, 'teacher-1', 1, 3)).toBe(true);
      
      dayCounts.set('teacher-1-1', 3);
      expect(teacherDailyLimit(dayCounts, 'teacher-1', 1, 3)).toBe(false);
    });

    test('teacherWeeklyLimit validation', () => {
      const weeklyCounts = new Map();
      weeklyCounts.set('teacher-1', 9);
      expect(teacherWeeklyLimit(weeklyCounts, 'teacher-1', 10)).toBe(true);

      weeklyCounts.set('teacher-1', 10);
      expect(teacherWeeklyLimit(weeklyCounts, 'teacher-1', 10)).toBe(false);
    });

    test('classNoDoubleBooking validation', () => {
      const grid = new Map();
      grid.set('1-1', { subject: 'subj-1' });
      expect(classNoDoubleBooking(grid, 1, 1)).toBe(false);
      expect(classNoDoubleBooking(grid, 1, 2)).toBe(true);
    });

    test('subjectMaxPerDay validation', () => {
      const counts = new Map();
      counts.set('subj-1-1', 1);
      expect(subjectMaxPerDay(counts, 'subj-1', 1, 2)).toBe(true);

      counts.set('subj-1-1', 2);
      expect(subjectMaxPerDay(counts, 'subj-1', 1, 2)).toBe(false);
    });

    test('consecutivePeriodsFit validation', () => {
      const grid = new Map();
      // Period 3 is lunch break
      expect(consecutivePeriodsFit(grid, 1, 1, 2, 6, [3])).toBe(true);
      expect(consecutivePeriodsFit(grid, 1, 2, 2, 6, [3])).toBe(false); // overlaps with period 3 (lunch)
      
      grid.set('1-1', { subject: 'subj-1' });
      expect(consecutivePeriodsFit(grid, 1, 1, 2, 6, [3])).toBe(false); // period 1 is occupied
    });

    test('roomNoDoubleBooking validation', () => {
      const rooms = new Map();
      rooms.set('Lab-A-1-1', { classId: 'class-2' });
      expect(roomNoDoubleBooking(rooms, 'Lab-A', 1, 1)).toBe(false);
      expect(roomNoDoubleBooking(rooms, 'Lab-A', 1, 2)).toBe(true);
    });
  });

  describe('PreValidator Tests', () => {
    test('should pass validation on correct config', () => {
      const res = preValidateClassSection({
        schoolClass: mockClass,
        section: mockSection,
        subjects: [mockSubject],
        teachers: [mockTeacher],
        config: mockConfig,
      });
      expect(res.valid).toBe(true);
      expect(res.conflicts.length).toBe(0);
    });

    test('should detect subject with no teacher', () => {
      const res = preValidateClassSection({
        schoolClass: mockClass,
        section: mockSection,
        subjects: [{ ...mockSubject, _id: 'subj-99' }],
        teachers: [mockTeacher],
        config: mockConfig,
      });
      expect(res.valid).toBe(false);
      expect(res.conflicts[0].type).toBe('subject_no_teacher');
    });

    test('should detect periods exceeding slots', () => {
      const res = preValidateClassSection({
        schoolClass: mockClass,
        section: mockSection,
        subjects: [{ ...mockSubject, weeklyPeriods: 40 }], // exceed limit
        teachers: [mockTeacher],
        config: mockConfig,
      });
      expect(res.valid).toBe(false);
      expect(res.conflicts[0].type).toBe('periods_exceed_slots');
    });
  });

  describe('Engine Generation Tests', () => {
    test('should generate a valid timetable successfully', () => {
      const engine = new TimetableEngine({
        schoolClass: mockClass,
        section: mockSection,
        subjects: [
          mockSubject,
          { _id: 'subj-2', name: 'Science', code: 'SCI101', weeklyPeriods: 3, maxPeriodsPerDay: 1, category: 'academic' },
        ],
        teachers: [
          mockTeacher,
          {
            _id: 'teacher-2',
            firstName: 'Sarah',
            lastName: 'Conor',
            subjects: ['subj-2'],
            assignedClasses: ['class-1'],
            availableWorkingDays: [1, 2, 3, 4, 5],
            weeklyTeachingLimit: 15,
            dailyTeachingLimit: 4,
          },
        ],
        config: mockConfig,
      });

      const res = engine.generate();
      expect(res.success).toBe(true);
      expect(res.periods.length).toBe(30); // 5 days * 6 periods = 30
      
      // Verify lunch breaks are set at period 3
      const lunches = res.periods.filter((p) => p.isLunch);
      expect(lunches.length).toBe(5);
      lunches.forEach((l) => expect(l.periodNo).toBe(3));

      // Verify Math is placed 4 times and Science is placed 3 times
      const mathPeriods = res.periods.filter((p) => p.subject?.toString() === 'subj-1');
      const sciencePeriods = res.periods.filter((p) => p.subject?.toString() === 'subj-2');
      expect(mathPeriods.length).toBe(4);
      expect(sciencePeriods.length).toBe(3);
    });
  });
});
