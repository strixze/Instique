import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import Student from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';

export const createExam = async (schoolId, data) => {
  const exam = await Exam.create({ ...data, schoolId });
  return exam;
};

export const getExams = async (schoolId, options) => {
  return paginate(Exam, { schoolId }, { ...options, searchFields: ['name'] });
};

export const getExamById = async (id, schoolId) => {
  const exam = await Exam.findOne({ _id: id, schoolId })
    .populate('schoolClass', 'name')
    .populate('academicYear', 'name')
    .populate('subjects.subject', 'name code');
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
};

export const updateExam = async (id, schoolId, data) => {
  const exam = await Exam.findOneAndUpdate({ _id: id, schoolId }, data, { new: true });
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
};

export const deleteExam = async (id, schoolId) => {
  const exam = await Exam.findOneAndDelete({ _id: id, schoolId });
  if (!exam) throw new ApiError(404, 'Exam not found');
  await Mark.deleteMany({ exam: id, schoolId });
  return true;
};

export const enterMark = async (schoolId, data, userId) => {
  const exam = await Exam.findById(data.exam);
  if (!exam) throw new ApiError(404, 'Exam not found');

  const subjectConfig = exam.subjects.find((s) => s.subject.toString() === data.subject);
  if (!subjectConfig) throw new ApiError(400, 'Subject not part of this exam');

  const existing = await Mark.findOne({ schoolId, exam: data.exam, subject: data.subject, student: data.student });
  if (existing) throw new ApiError(409, 'Marks already entered for this student/subject');

  const percentage = (data.marksObtained / subjectConfig.maxMarks) * 100;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B+';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';

  const mark = await Mark.create({
    ...data,
    schoolId,
    maxMarks: subjectConfig.maxMarks,
    passMarks: subjectConfig.passMarks,
    grade,
    percentage: Math.round(percentage * 100) / 100,
    enteredBy: userId,
  });

  return mark;
};

export const getMarks = async (schoolId, options) => {
  return paginate(Mark, { schoolId }, options);
};

export const getMarksByExam = async (schoolId, examId) => {
  const marks = await Mark.find({ schoolId, exam: examId })
    .populate('student', 'firstName lastName admissionNo')
    .populate('subject', 'name code');
  return marks;
};

export const publishResults = async (schoolId, examId) => {
  const exam = await Exam.findOneAndUpdate({ _id: examId, schoolId }, { status: 'published' }, { new: true });
  if (!exam) throw new ApiError(404, 'Exam not found');
  return exam;
};

// ── New: Fetch students belonging to exam's assigned class ──

export const getExamStudents = async (schoolId, examId) => {
  const exam = await Exam.findOne({ _id: examId, schoolId });
  if (!exam) throw new ApiError(404, 'Exam not found');
  if (!exam.schoolClass) throw new ApiError(400, 'No class assigned to this exam');

  const students = await Student.find({
    schoolId,
    currentClass: exam.schoolClass,
    status: 'active',
  })
    .select('firstName lastName admissionNo rollNo currentSection')
    .populate('currentSection', 'name')
    .sort({ rollNo: 1, firstName: 1 });

  return students;
};

// ── New: Bulk save/update marks with validation ──

const computeGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

export const saveMarks = async (schoolId, examId, marksArray, status, userId) => {
  const exam = await Exam.findOne({ _id: examId, schoolId });
  if (!exam) throw new ApiError(404, 'Exam not found');

  // Build lookup maps for exam subjects
  const subjectMap = new Map();
  for (const s of exam.subjects) {
    subjectMap.set(s.subject.toString(), { maxMarks: s.maxMarks, passMarks: s.passMarks });
  }

  // Validate all students belong to the exam's class
  const studentIds = [...new Set(marksArray.map((m) => m.student))];
  const students = await Student.find({
    _id: { $in: studentIds },
    schoolId,
    currentClass: exam.schoolClass,
    status: 'active',
  }).select('_id');
  const validStudentIds = new Set(students.map((s) => s._id.toString()));

  const errors = [];
  const bulkOps = [];

  for (const entry of marksArray) {
    // Validate student belongs to exam class
    if (!validStudentIds.has(entry.student)) {
      errors.push({ student: entry.student, subject: entry.subject, error: 'Student does not belong to exam class' });
      continue;
    }

    // Validate subject is part of exam
    const subjectConfig = subjectMap.get(entry.subject);
    if (!subjectConfig) {
      errors.push({ student: entry.student, subject: entry.subject, error: 'Subject not part of this exam' });
      continue;
    }

    // Validate marks range
    if (entry.marksObtained < 0) {
      errors.push({ student: entry.student, subject: entry.subject, error: 'Marks cannot be negative' });
      continue;
    }
    if (entry.marksObtained > subjectConfig.maxMarks) {
      errors.push({ student: entry.student, subject: entry.subject, error: `Marks cannot exceed ${subjectConfig.maxMarks}` });
      continue;
    }

    const pct = (entry.marksObtained / subjectConfig.maxMarks) * 100;
    const grade = computeGrade(pct);

    bulkOps.push({
      updateOne: {
        filter: { schoolId, exam: examId, subject: entry.subject, student: entry.student },
        update: {
          $set: {
            marksObtained: entry.marksObtained,
            maxMarks: subjectConfig.maxMarks,
            passMarks: subjectConfig.passMarks,
            grade,
            percentage: Math.round(pct * 100) / 100,
            status: status || 'draft',
            enteredBy: userId,
          },
        },
        upsert: true,
      },
    });
  }

  if (bulkOps.length > 0) {
    await Mark.bulkWrite(bulkOps);
  }

  // Fetch and return all marks for this exam
  const savedMarks = await Mark.find({ schoolId, exam: examId })
    .populate('student', 'firstName lastName admissionNo rollNo')
    .populate('subject', 'name code');

  return { saved: bulkOps.length, errors, marks: savedMarks };
};

// ── New: Compute full exam results with ranking ──

export const getExamResults = async (schoolId, examId) => {
  const exam = await Exam.findOne({ _id: examId, schoolId })
    .populate('schoolClass', 'name')
    .populate('academicYear', 'name')
    .populate('subjects.subject', 'name code');
  if (!exam) throw new ApiError(404, 'Exam not found');

  // Get all students in the class
  const students = await Student.find({
    schoolId,
    currentClass: exam.schoolClass._id || exam.schoolClass,
    status: 'active',
  })
    .select('firstName lastName admissionNo rollNo currentSection')
    .populate('currentSection', 'name')
    .sort({ rollNo: 1, firstName: 1 });

  // Get all marks for this exam
  const marks = await Mark.find({ schoolId, exam: examId });

  // Build a marks lookup: studentId -> subjectId -> mark
  const marksMap = new Map();
  for (const m of marks) {
    const sid = m.student.toString();
    if (!marksMap.has(sid)) marksMap.set(sid, new Map());
    marksMap.get(sid).set(m.subject.toString(), m);
  }

  // Exam subject configs
  const examSubjects = exam.subjects.map((s) => ({
    subjectId: s.subject._id.toString(),
    name: s.subject.name,
    code: s.subject.code,
    maxMarks: s.maxMarks,
    passMarks: s.passMarks,
  }));
  const maxTotal = examSubjects.reduce((sum, s) => sum + s.maxMarks, 0);

  // Build per-student results
  const results = students.map((student) => {
    const studentMarks = marksMap.get(student._id.toString()) || new Map();
    let totalObtained = 0;
    let allSubjectsEntered = true;
    let allSubjectsPassed = true;
    const subjectResults = [];

    for (const subj of examSubjects) {
      const mark = studentMarks.get(subj.subjectId);
      if (mark) {
        const passed = mark.marksObtained >= subj.passMarks;
        if (!passed) allSubjectsPassed = false;
        totalObtained += mark.marksObtained;
        subjectResults.push({
          subjectId: subj.subjectId,
          name: subj.name,
          code: subj.code,
          marksObtained: mark.marksObtained,
          maxMarks: subj.maxMarks,
          passMarks: subj.passMarks,
          grade: mark.grade,
          passed,
          status: mark.status,
        });
      } else {
        allSubjectsEntered = false;
        subjectResults.push({
          subjectId: subj.subjectId,
          name: subj.name,
          code: subj.code,
          marksObtained: null,
          maxMarks: subj.maxMarks,
          passMarks: subj.passMarks,
          grade: null,
          passed: null,
          status: null,
        });
      }
    }

    const isComplete = allSubjectsEntered;
    const percentage = isComplete ? Math.round((totalObtained / maxTotal) * 10000) / 100 : null;
    const result = !isComplete ? 'incomplete' : (allSubjectsPassed ? 'pass' : 'fail');

    return {
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        section: student.currentSection,
      },
      subjects: subjectResults,
      totalObtained: isComplete ? totalObtained : null,
      maxTotal,
      percentage,
      result,
      rank: null, // assigned below
    };
  });

  // Assign competition ranking to complete results only
  const complete = results.filter((r) => r.result !== 'incomplete');
  complete.sort((a, b) => b.percentage - a.percentage);
  let currentRank = 0;
  let lastPct = null;
  let skipCount = 0;
  for (let i = 0; i < complete.length; i++) {
    if (complete[i].percentage !== lastPct) {
      currentRank = i + 1;
      lastPct = complete[i].percentage;
    }
    complete[i].rank = currentRank;
  }

  // Sort final results: ranked first (by rank asc), then incomplete at bottom
  results.sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return (a.student.rollNo || 0) - (b.student.rollNo || 0);
  });

  // Compute summary stats
  const totalStudents = results.length;
  const completedCount = complete.length;
  const incompleteCount = totalStudents - completedCount;
  const passedCount = results.filter((r) => r.result === 'pass').length;
  const failedCount = results.filter((r) => r.result === 'fail').length;
  const completePcts = complete.map((r) => r.percentage);
  const classAverage = completePcts.length > 0
    ? Math.round((completePcts.reduce((a, b) => a + b, 0) / completePcts.length) * 100) / 100
    : null;
  const highestPercentage = completePcts.length > 0 ? Math.max(...completePcts) : null;

  return {
    exam: {
      _id: exam._id,
      name: exam.name,
      type: exam.type,
      status: exam.status,
      schoolClass: exam.schoolClass,
      academicYear: exam.academicYear,
      startDate: exam.startDate,
      endDate: exam.endDate,
    },
    subjects: examSubjects,
    maxTotal,
    summary: {
      totalStudents,
      completed: completedCount,
      incomplete: incompleteCount,
      passed: passedCount,
      failed: failedCount,
      classAverage,
      highestPercentage,
    },
    results,
  };
};

