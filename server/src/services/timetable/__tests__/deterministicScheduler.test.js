import { validateSchedulingData } from '../validator.service.js';
import { scheduleTimetables } from '../scheduler.service.js';

describe('Deterministic Scheduler Unit Tests', () => {
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

  const mockTeachers = [
    {
      _id: 'teacher-1',
      firstName: 'John',
      lastName: 'Doe',
      subjects: ['subj-1'],
      assignedClasses: [],
      availableWorkingDays: [1, 2, 3, 4, 5],
      unavailablePeriods: [],
      weeklyTeachingLimit: 20,
      dailyTeachingLimit: 4,
      status: 'active',
    },
    {
      _id: 'teacher-2',
      firstName: 'Sarah',
      lastName: 'Conor',
      subjects: ['subj-2'],
      assignedClasses: [],
      availableWorkingDays: [1, 2, 3, 4, 5],
      weeklyTeachingLimit: 20,
      dailyTeachingLimit: 4,
      status: 'active',
    }
  ];

  const mockSubjects = [
    {
      _id: 'subj-1',
      name: 'Mathematics',
      code: 'MATH101',
      weeklyPeriods: 4,
      maxPeriodsPerDay: 2,
    },
    {
      _id: 'subj-2',
      name: 'Science',
      code: 'SCI101',
      weeklyPeriods: 3,
      maxPeriodsPerDay: 2,
    }
  ];

  const mockClass = {
    _id: 'class-1',
    name: 'Grade 10',
    subjects: ['subj-1', 'subj-2'],
    sections: [{ _id: 'sec-1', name: 'A', roomNo: 'Room-101' }]
  };

  const mockClassSections = [
    {
      schoolClass: mockClass,
      classId: 'class-1',
      className: 'Grade 10',
      section: { _id: 'sec-1', name: 'A', roomNo: 'Room-101' },
      sectionId: 'sec-1',
      sectionName: 'A',
      subjects: mockSubjects
    }
  ];

  describe('Pre-Generation Validator', () => {
    test('should validate correct data', () => {
      const res = validateSchedulingData(mockConfig, [mockClass], mockTeachers, mockSubjects, mockClassSections);
      expect(res.success).toBe(true);
    });

    test('should detect missing teacher', () => {
      const res = validateSchedulingData(mockConfig, [mockClass], [], mockSubjects, mockClassSections);
      expect(res.success).toBe(false);
      expect(res.errors.some(e => e.type === 'MISSING_TEACHERS')).toBe(true);
    });
  });

  describe('Solver Engine', () => {
    test('should schedule periods deterministically', () => {
      const metrics = { conflictsChecked: 0, backtrackCount: 0 };
      const res = scheduleTimetables(mockConfig, mockClassSections, mockTeachers, [], metrics);
      
      expect(res.success).toBe(true);
      // 5 days × 6 periods = 30 total slots. 5 lunch + 25 teaching = 30 classSchedule entries
      expect(res.classSchedule.size).toBe(30);

      // Verify lunch is set at period 3
      const keyPrefix = 'class-1-sec-1';
      for (let day = 1; day <= 5; day++) {
        const slot = res.classSchedule.get(`${keyPrefix}-${day}-3`);
        expect(slot.isLunch).toBe(true);
        expect(slot.label).toBe('Lunch Break');
      }

      // Verify subjects are distributed evenly across all 25 teaching slots
      // 2 subjects across 25 slots = 13 + 12 (round-robin)
      let mathCount = 0;
      let scienceCount = 0;
      for (const val of res.classSchedule.values()) {
        if (val.subjectId === 'subj-1') mathCount++;
        if (val.subjectId === 'subj-2') scienceCount++;
      }
      expect(mathCount + scienceCount).toBe(25);
      expect(mathCount).toBe(13); // first subject gets remainder
      expect(scienceCount).toBe(12);
    });
  });
});
