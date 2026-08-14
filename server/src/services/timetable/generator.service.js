/**
 * generator.service.js
 * Main orchestrator for deterministic timetable scheduling.
 */

import { getConfig } from '../timetableConfig.service.js';
import SchoolClass from '../../models/SchoolClass.js';
import Section from '../../models/Section.js';
import Subject from '../../models/Subject.js';
import Teacher from '../../models/Teacher.js';
import Timetable from '../../models/Timetable.js';
import { validateSchedulingData } from './validator.service.js';
import { scheduleTimetables } from './scheduler.service.js';
import { saveGeneratedTimetables } from './save.service.js';
import ApiError from '../../utils/ApiError.js';

export const generateDeterministicTimetables = async (schoolId, data) => {
  const startTime = Date.now();
  const metrics = {
    conflictsChecked: 0,
    backtrackCount: 0
  };

  const academicYearId = data.academicYear;
  const singleClassId = data.schoolClass || null;

  console.log(`[Timetable Scheduler] Generation started for academicYear: ${academicYearId}`);

  // 1. Load configuration
  const config = await getConfig(schoolId, academicYearId);
  if (!config) {
    throw new ApiError(404, 'Timetable configuration not found for this academic year.');
  }

  // 2. Load teachers, subjects, classes, sections
  const teachers = await Teacher.find({ schoolId, status: 'active' });
  const subjects = await Subject.find({ schoolId });

  let classes = [];
  if (singleClassId) {
    // Generate for a single class — ALL its sections
    const singleClass = await SchoolClass.findOne({ schoolId, _id: singleClassId }).populate('sections');
    if (singleClass) classes = [singleClass];
  } else {
    classes = await SchoolClass.find({ schoolId, academicYear: academicYearId }).populate('sections');
  }

  // Build class-section list (all sections of each class)
  const classSections = [];
  for (const classObj of classes) {
    const classSubjects = subjects.filter(sub => classObj.subjects.some(id => id.toString() === sub._id.toString()));
    
    for (const sec of classObj.sections) {
      classSections.push({
        schoolClass: classObj,
        classId: classObj._id.toString(),
        className: classObj.name,
        section: sec,
        sectionId: sec._id.toString(),
        sectionName: sec.name,
        subjects: classSubjects
      });
    }
  }

  // 3. Pre-generation Validation
  console.log('[Timetable Scheduler] Validation started...');
  const validation = validateSchedulingData(config, classes, teachers, subjects, classSections);
  console.log('[Timetable Scheduler] Validation completed.');

  if (!validation.success) {
    console.log('[Timetable Scheduler] Validation failed: ', JSON.stringify(validation.errors, null, 2));
    
    const errorsForLog = validation.errors.map(err => ({
      type: err.type,
      severity: 'error',
      message: err.message,
      context: err.context || {}
    }));

    await saveGeneratedTimetables(
      schoolId,
      academicYearId,
      classSections,
      new Map(),
      config,
      config.workingDays || [1, 2, 3, 4, 5, 6],
      config.periodsPerDay || 8,
      errorsForLog
    );

    return {
      success: true,
      message: "Pre-validation failed. Timetable draft created with conflict logs.",
      errors: validation.errors
    };
  }

  // 4. Gather pre-allocated/locked periods from published timetables
  const lockQuery = { schoolId, academicYear: academicYearId, status: 'published' };

  const lockedTimetables = await Timetable.find(lockQuery)
    .populate('schoolClass', 'name')
    .populate('section', 'name');

  const lockedPeriods = [];
  lockedTimetables.forEach(t => {
    t.periods.forEach(p => {
      if (p.teacher && p.subject) {
        lockedPeriods.push({
          day: p.day,
          periodNo: p.periodNo,
          teacherId: p.teacher.toString(),
          classId: t.schoolClass._id.toString(),
          className: t.schoolClass.name,
          sectionId: t.section._id.toString(),
          sectionName: t.section.name,
          subjectId: p.subject.toString(),
          room: p.room || ''
        });
      }
    });
  });

  // 5. Core Scheduling Algorithm
  console.log('[Timetable Scheduler] Generation started...');
  const result = scheduleTimetables(config, classSections, teachers, lockedPeriods, metrics);
  console.log('[Timetable Scheduler] Generation completed.');

  const generationTimeMs = Date.now() - startTime;
  console.log(`[Timetable Scheduler] Generation time: ${generationTimeMs}ms`);
  console.log(`[Timetable Scheduler] Total conflicts checked: ${metrics.conflictsChecked}`);

  // 6. Save Timetables (always succeeds with greedy approach)
  console.log('[Timetable Scheduler] Saving timetable...');
  const saveResult = await saveGeneratedTimetables(
    schoolId,
    academicYearId,
    classSections,
    result.classSchedule,
    config,
    result.workingDays,
    result.periodsPerDay
  );

  const totalClasses = new Set(classSections.map(cs => cs.classId)).size;

  return {
    success: true,
    message: "Timetable generated successfully.",
    generatedClasses: totalClasses,
    generatedSections: classSections.length,
    generatedPeriods: saveResult.savedPeriods,
    conflicts: []
  };
};
