import ExcelJS from 'exceljs';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import AcademicYear from '../models/AcademicYear.js';
import ApiError from '../utils/ApiError.js';

// ─── Template Definitions ────────────────────────────────────────────────────

const TEMPLATES = {
  students: {
    label: 'Students',
    columns: [
      { header: 'firstName', key: 'firstName', width: 18, required: true, note: 'First name of the student' },
      { header: 'lastName', key: 'lastName', width: 18, required: true, note: 'Last name of the student' },
      { header: 'admissionNo', key: 'admissionNo', width: 18, required: true, note: 'Unique admission number (e.g. ADM-2026-001)' },
      { header: 'gender', key: 'gender', width: 12, required: true, note: 'male / female / other' },
      { header: 'dateOfBirth', key: 'dateOfBirth', width: 16, required: true, note: 'Date of birth in YYYY-MM-DD format' },
      { header: 'className', key: 'className', width: 16, required: false, note: 'Class name as defined in your school (e.g. Grade 8)' },
      { header: 'sectionName', key: 'sectionName', width: 14, required: false, note: 'Section name (e.g. A, B)' },
      { header: 'phone', key: 'phone', width: 18, required: false, note: 'Contact phone number' },
      { header: 'email', key: 'email', width: 24, required: false, note: 'Contact email address' },
      { header: 'address', key: 'address', width: 30, required: false, note: 'Home address' },
    ],
    sampleRows: [
      { firstName: 'Arjun', lastName: 'Sharma', admissionNo: 'ADM-2026-001', gender: 'male', dateOfBirth: '2014-05-15', className: 'Grade 8', sectionName: 'A', phone: '+91 90000 00001', email: 'arjun@example.com', address: '123 Main Street' },
      { firstName: 'Priya', lastName: 'Patel', admissionNo: 'ADM-2026-002', gender: 'female', dateOfBirth: '2014-08-22', className: 'Grade 8', sectionName: 'B', phone: '+91 90000 00002', email: 'priya@example.com', address: '456 Oak Avenue' },
    ],
  },
  teachers: {
    label: 'Teachers',
    columns: [
      { header: 'firstName', key: 'firstName', width: 18, required: true, note: 'First name of the teacher' },
      { header: 'lastName', key: 'lastName', width: 18, required: true, note: 'Last name of the teacher' },
      { header: 'employeeId', key: 'employeeId', width: 18, required: true, note: 'Unique employee ID (e.g. TCH-001)' },
      { header: 'gender', key: 'gender', width: 12, required: false, note: 'male / female / other' },
      { header: 'dateOfBirth', key: 'dateOfBirth', width: 16, required: false, note: 'Date of birth in YYYY-MM-DD format' },
      { header: 'department', key: 'department', width: 18, required: false, note: 'Department name (e.g. Science, Mathematics)' },
      { header: 'phone', key: 'phone', width: 18, required: false, note: 'Contact phone number' },
      { header: 'email', key: 'email', width: 24, required: false, note: 'Contact email address' },
    ],
    sampleRows: [
      { firstName: 'Rajesh', lastName: 'Kumar', employeeId: 'TCH-001', gender: 'male', dateOfBirth: '1985-03-10', department: 'Mathematics', phone: '+91 90000 00010', email: 'rajesh@school.edu' },
      { firstName: 'Anita', lastName: 'Singh', employeeId: 'TCH-002', gender: 'female', dateOfBirth: '1990-07-25', department: 'Science', phone: '+91 90000 00011', email: 'anita@school.edu' },
    ],
  },
  classes: {
    label: 'Classes',
    columns: [
      { header: 'name', key: 'name', width: 18, required: true, note: 'Class name (e.g. Grade 8, Class 10)' },
      { header: 'academicYear', key: 'academicYear', width: 18, required: true, note: 'Academic year name as created (e.g. 2026-2027)' },
      { header: 'classTeacher', key: 'classTeacher', width: 18, required: false, note: 'Employee ID of the class teacher (e.g. TCH-001)' },
    ],
    sampleRows: [
      { name: 'Grade 8', academicYear: '2026-2027', classTeacher: 'TCH-001' },
      { name: 'Grade 9', academicYear: '2026-2027', classTeacher: 'TCH-002' },
    ],
  },
  sections: {
    label: 'Sections',
    columns: [
      { header: 'name', key: 'name', width: 14, required: true, note: 'Section name (e.g. A, B, C)' },
      { header: 'className', key: 'className', width: 18, required: true, note: 'Class name this section belongs to (e.g. Grade 8)' },
      { header: 'roomNo', key: 'roomNo', width: 14, required: false, note: 'Room number' },
    ],
    sampleRows: [
      { name: 'A', className: 'Grade 8', roomNo: '201' },
      { name: 'B', className: 'Grade 8', roomNo: '202' },
    ],
  },
  subjects: {
    label: 'Subjects',
    columns: [
      { header: 'name', key: 'name', width: 20, required: true, note: 'Subject name (e.g. Mathematics)' },
      { header: 'code', key: 'code', width: 14, required: true, note: 'Unique subject code (e.g. MATH)' },
      { header: 'type', key: 'type', width: 18, required: false, note: 'core / elective / co-curricular (default: core)' },
      { header: 'weeklyPeriods', key: 'weeklyPeriods', width: 16, required: false, note: 'Number of periods per week (default: 5)' },
      { header: 'maxMarks', key: 'maxMarks', width: 14, required: false, note: 'Maximum marks (default: 100)' },
      { header: 'passMarks', key: 'passMarks', width: 14, required: false, note: 'Passing marks (default: 33)' },
    ],
    sampleRows: [
      { name: 'Mathematics', code: 'MATH', type: 'core', weeklyPeriods: 6, maxMarks: 100, passMarks: 33 },
      { name: 'English', code: 'ENG', type: 'core', weeklyPeriods: 5, maxMarks: 100, passMarks: 33 },
    ],
  },
};

// ─── Template Generation ─────────────────────────────────────────────────────

export const generateTemplate = async (type) => {
  const template = TEMPLATES[type];
  if (!template) throw new ApiError(400, `Invalid template type: ${type}`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Instique';
  workbook.created = new Date();

  // Data sheet
  const dataSheet = workbook.addWorksheet(template.label);
  dataSheet.columns = template.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style the header row
  const headerRow = dataSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 24;

  // Mark required columns
  template.columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    if (col.required) {
      cell.value = `${col.header} *`;
    }
  });

  // Add sample data rows
  template.sampleRows.forEach((row) => {
    const dataRow = dataSheet.addRow(row);
    dataRow.font = { color: { argb: 'FF9CA3AF' }, italic: true };
  });

  // Instructions sheet
  const instructionSheet = workbook.addWorksheet('Instructions');
  instructionSheet.columns = [
    { header: 'Column', key: 'column', width: 20 },
    { header: 'Required', key: 'required', width: 12 },
    { header: 'Description', key: 'description', width: 50 },
  ];

  const instrHeaderRow = instructionSheet.getRow(1);
  instrHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  instrHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  instrHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  instrHeaderRow.height = 24;

  template.columns.forEach((col) => {
    instructionSheet.addRow({
      column: col.header,
      required: col.required ? 'Yes' : 'No',
      description: col.note,
    });
  });

  // Add general notes
  const noteRow = instructionSheet.addRow({});
  noteRow.height = 10;
  instructionSheet.addRow({ column: 'NOTES:', required: '', description: '' }).font = { bold: true };
  instructionSheet.addRow({ column: '', required: '', description: '1. Delete the sample data rows before importing.' });
  instructionSheet.addRow({ column: '', required: '', description: '2. Columns marked with * are required.' });
  instructionSheet.addRow({ column: '', required: '', description: '3. Dates must be in YYYY-MM-DD format (e.g. 2014-05-15).' });
  instructionSheet.addRow({ column: '', required: '', description: '4. Rows with errors will be skipped; valid rows will still be imported.' });

  return workbook;
};

// ─── File Parsing ────────────────────────────────────────────────────────────

const parseCSV = (buffer) => {
  const text = buffer.toString('utf-8');
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const parseExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) return [];

  const headerRow = worksheet.getRow(1);
  const headers = [];
  headerRow.eachCell((cell, colNumber) => {
    let val = String(cell.value || '').trim();
    // Remove the " *" required marker from headers
    val = val.replace(/\s*\*$/, '');
    headers[colNumber] = val;
  });

  const rows = [];
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const obj = {};
    let hasValue = false;

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;

      let value = cell.value;
      // Handle ExcelJS date objects
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
      } else if (typeof value === 'object' && value !== null) {
        // Handle rich text or hyperlink objects
        value = value.text || value.result || String(value);
      }
      value = String(value || '').trim();
      if (value) hasValue = true;
      obj[header] = value;
    });

    if (hasValue) rows.push(obj);
  }

  return rows;
};

export const parseFile = async (file) => {
  const originalName = file.originalname.toLowerCase();

  if (originalName.endsWith('.csv')) {
    return parseCSV(file.buffer);
  } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
    return parseExcel(file.buffer);
  } else {
    throw new ApiError(400, 'Unsupported file format. Please upload an Excel (.xlsx) or CSV (.csv) file.');
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const trimOrNull = (val) => {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
};

const parseDate = (val) => {
  const s = trimOrNull(val);
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
};

// ─── Import Logic ────────────────────────────────────────────────────────────

export const importStudents = async (schoolId, rows) => {
  const results = { created: 0, skipped: 0, errors: [] };

  // Pre-fetch lookups
  const classes = await SchoolClass.find({ schoolId });
  const sections = await Section.find({ schoolId });
  const classNameMap = new Map();
  classes.forEach((c) => classNameMap.set(c.name.toLowerCase(), c));
  const sectionMap = new Map();
  sections.forEach((s) => {
    const key = `${s.schoolClass.toString()}_${s.name.toLowerCase()}`;
    sectionMap.set(key, s);
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because row 1 is header and arrays are 0-indexed
    const errors = [];

    const firstName = trimOrNull(row.firstName);
    const lastName = trimOrNull(row.lastName);
    const admissionNo = trimOrNull(row.admissionNo);
    const gender = trimOrNull(row.gender)?.toLowerCase();
    const dateOfBirth = parseDate(row.dateOfBirth);

    if (!firstName) errors.push({ field: 'firstName', message: 'First name is required' });
    if (!lastName) errors.push({ field: 'lastName', message: 'Last name is required' });
    if (!admissionNo) errors.push({ field: 'admissionNo', message: 'Admission number is required' });
    if (!gender || !['male', 'female', 'other'].includes(gender)) errors.push({ field: 'gender', message: 'Gender must be male, female, or other' });
    if (!dateOfBirth) errors.push({ field: 'dateOfBirth', message: 'Valid date of birth is required (YYYY-MM-DD)' });

    // Resolve class
    let classId = undefined;
    const className = trimOrNull(row.className);
    if (className) {
      const cls = classNameMap.get(className.toLowerCase());
      if (!cls) {
        errors.push({ field: 'className', message: `Class "${className}" not found` });
      } else {
        classId = cls._id;
      }
    }

    // Resolve section
    let sectionId = undefined;
    const sectionName = trimOrNull(row.sectionName);
    if (sectionName && classId) {
      const key = `${classId.toString()}_${sectionName.toLowerCase()}`;
      const sec = sectionMap.get(key);
      if (!sec) {
        errors.push({ field: 'sectionName', message: `Section "${sectionName}" not found in class "${className}"` });
      } else {
        sectionId = sec._id;
      }
    }

    if (errors.length > 0) {
      results.errors.push({ row: rowNum, errors });
      results.skipped++;
      continue;
    }

    try {
      // Check duplicate
      const existing = await Student.findOne({ schoolId, admissionNo });
      if (existing) {
        results.errors.push({ row: rowNum, errors: [{ field: 'admissionNo', message: `Admission number "${admissionNo}" already exists` }] });
        results.skipped++;
        continue;
      }

      await Student.create({
        schoolId,
        firstName,
        lastName,
        admissionNo,
        gender,
        dateOfBirth,
        currentClass: classId,
        currentSection: sectionId,
        contact: {
          phone: trimOrNull(row.phone) || undefined,
          email: trimOrNull(row.email) || undefined,
          address: trimOrNull(row.address) || undefined,
        },
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: rowNum, errors: [{ field: 'general', message: err.message }] });
      results.skipped++;
    }
  }

  return results;
};

export const importTeachers = async (schoolId, rows) => {
  const results = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const errors = [];

    const firstName = trimOrNull(row.firstName);
    const lastName = trimOrNull(row.lastName);
    const employeeId = trimOrNull(row.employeeId);
    const gender = trimOrNull(row.gender)?.toLowerCase();
    const dateOfBirth = parseDate(row.dateOfBirth);

    if (!firstName) errors.push({ field: 'firstName', message: 'First name is required' });
    if (!lastName) errors.push({ field: 'lastName', message: 'Last name is required' });
    if (!employeeId) errors.push({ field: 'employeeId', message: 'Employee ID is required' });
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      errors.push({ field: 'gender', message: 'Gender must be male, female, or other' });
    }

    if (errors.length > 0) {
      results.errors.push({ row: rowNum, errors });
      results.skipped++;
      continue;
    }

    try {
      const existing = await Teacher.findOne({ schoolId, employeeId });
      if (existing) {
        results.errors.push({ row: rowNum, errors: [{ field: 'employeeId', message: `Employee ID "${employeeId}" already exists` }] });
        results.skipped++;
        continue;
      }

      await Teacher.create({
        schoolId,
        firstName,
        lastName,
        employeeId,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        department: trimOrNull(row.department) || undefined,
        contact: {
          phone: trimOrNull(row.phone) || undefined,
          email: trimOrNull(row.email) || undefined,
        },
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: rowNum, errors: [{ field: 'general', message: err.message }] });
      results.skipped++;
    }
  }

  return results;
};

export const importClasses = async (schoolId, rows) => {
  const results = { created: 0, skipped: 0, errors: [] };

  // Pre-fetch lookups
  const academicYears = await AcademicYear.find({ schoolId });
  const yearNameMap = new Map();
  academicYears.forEach((y) => yearNameMap.set(y.name.toLowerCase(), y));

  const teachers = await Teacher.find({ schoolId });
  const teacherEmpMap = new Map();
  teachers.forEach((t) => teacherEmpMap.set(t.employeeId.toLowerCase(), t));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const errors = [];

    const name = trimOrNull(row.name);
    const academicYearName = trimOrNull(row.academicYear);

    if (!name) errors.push({ field: 'name', message: 'Class name is required' });
    if (!academicYearName) errors.push({ field: 'academicYear', message: 'Academic year is required' });

    let academicYearId = undefined;
    if (academicYearName) {
      const year = yearNameMap.get(academicYearName.toLowerCase());
      if (!year) {
        errors.push({ field: 'academicYear', message: `Academic year "${academicYearName}" not found` });
      } else {
        academicYearId = year._id;
      }
    }

    let classTeacherId = undefined;
    const classTeacherEmpId = trimOrNull(row.classTeacher);
    if (classTeacherEmpId) {
      const teacher = teacherEmpMap.get(classTeacherEmpId.toLowerCase());
      if (!teacher) {
        errors.push({ field: 'classTeacher', message: `Teacher with employee ID "${classTeacherEmpId}" not found` });
      } else {
        classTeacherId = teacher._id;
      }
    }

    if (errors.length > 0) {
      results.errors.push({ row: rowNum, errors });
      results.skipped++;
      continue;
    }

    try {
      const existing = await SchoolClass.findOne({ schoolId, name, academicYear: academicYearId });
      if (existing) {
        results.errors.push({ row: rowNum, errors: [{ field: 'name', message: `Class "${name}" already exists for this academic year` }] });
        results.skipped++;
        continue;
      }

      await SchoolClass.create({
        schoolId,
        name,
        academicYear: academicYearId,
        classTeacher: classTeacherId || undefined,
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: rowNum, errors: [{ field: 'general', message: err.message }] });
      results.skipped++;
    }
  }

  return results;
};

export const importSections = async (schoolId, rows) => {
  const results = { created: 0, skipped: 0, errors: [] };

  // Pre-fetch classes
  const classes = await SchoolClass.find({ schoolId });
  const classNameMap = new Map();
  classes.forEach((c) => classNameMap.set(c.name.toLowerCase(), c));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const errors = [];

    const name = trimOrNull(row.name);
    const className = trimOrNull(row.className);

    if (!name) errors.push({ field: 'name', message: 'Section name is required' });
    if (!className) errors.push({ field: 'className', message: 'Class name is required' });

    let classId = undefined;
    if (className) {
      const cls = classNameMap.get(className.toLowerCase());
      if (!cls) {
        errors.push({ field: 'className', message: `Class "${className}" not found` });
      } else {
        classId = cls._id;
      }
    }

    if (errors.length > 0) {
      results.errors.push({ row: rowNum, errors });
      results.skipped++;
      continue;
    }

    try {
      const existing = await Section.findOne({ schoolId, schoolClass: classId, name });
      if (existing) {
        results.errors.push({ row: rowNum, errors: [{ field: 'name', message: `Section "${name}" already exists in class "${className}"` }] });
        results.skipped++;
        continue;
      }

      const section = await Section.create({
        schoolId,
        name,
        schoolClass: classId,
        roomNo: trimOrNull(row.roomNo) || undefined,
      });

      // Also push into SchoolClass.sections array
      await SchoolClass.findByIdAndUpdate(classId, { $push: { sections: section._id } });

      results.created++;
    } catch (err) {
      results.errors.push({ row: rowNum, errors: [{ field: 'general', message: err.message }] });
      results.skipped++;
    }
  }

  return results;
};

export const importSubjects = async (schoolId, rows) => {
  const results = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const errors = [];

    const name = trimOrNull(row.name);
    const code = trimOrNull(row.code);
    const type = trimOrNull(row.type)?.toLowerCase() || 'core';

    if (!name) errors.push({ field: 'name', message: 'Subject name is required' });
    if (!code) errors.push({ field: 'code', message: 'Subject code is required' });
    if (!['core', 'elective', 'co-curricular'].includes(type)) {
      errors.push({ field: 'type', message: 'Type must be core, elective, or co-curricular' });
    }

    if (errors.length > 0) {
      results.errors.push({ row: rowNum, errors });
      results.skipped++;
      continue;
    }

    try {
      const existing = await Subject.findOne({ schoolId, code });
      if (existing) {
        existing.name = name;
        existing.type = type;
        existing.weeklyPeriods = Number(row.weeklyPeriods) || existing.weeklyPeriods || 5;
        existing.maxMarks = Number(row.maxMarks) || existing.maxMarks || 100;
        existing.passMarks = Number(row.passMarks) || existing.passMarks || 33;
        await existing.save();
        results.updated++;
        continue;
      }

      await Subject.create({
        schoolId,
        name,
        code,
        type,
        weeklyPeriods: Number(row.weeklyPeriods) || 5,
        maxMarks: Number(row.maxMarks) || 100,
        passMarks: Number(row.passMarks) || 33,
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row: rowNum, errors: [{ field: 'general', message: err.message }] });
      results.skipped++;
    }
  }

  return results;
};

// ─── Dispatcher ──────────────────────────────────────────────────────────────

const importHandlers = {
  students: importStudents,
  teachers: importTeachers,
  classes: importClasses,
  sections: importSections,
  subjects: importSubjects,
};

export const importData = async (type, schoolId, rows) => {
  const handler = importHandlers[type];
  if (!handler) throw new ApiError(400, `Invalid import type: ${type}`);
  if (!rows || rows.length === 0) throw new ApiError(400, 'No data rows found in the uploaded file');
  return handler(schoolId, rows);
};
