import jsPDF from 'jspdf';
import { DEFAULT_PERIOD_TIMES } from './timetableTheme';

/**
 * Helper to safely resolve subject name (prevents showing raw MongoDB ObjectIds)
 */
export function getSubjectName(subject, subjects = []) {
  if (!subject) return '';
  if (typeof subject === 'object' && subject.name) return subject.name;
  if (typeof subject === 'string') {
    const found = subjects.find((s) => s._id === subject || s.id === subject);
    if (found?.name) return found.name;
    if (/^[0-9a-fA-F]{24}$/.test(subject)) return '';
    return subject;
  }
  return '';
}

/**
 * Helper to safely resolve teacher name
 */
export function getTeacherName(teacher, teachers = []) {
  if (!teacher) return '';
  if (typeof teacher === 'object') {
    const full = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    if (full) return full;
    if (teacher.name) return teacher.name;
  }
  if (typeof teacher === 'string') {
    const found = teachers.find((t) => t._id === teacher || t.id === teacher);
    if (found) {
      const full = `${found.firstName || ''} ${found.lastName || ''}`.trim();
      if (full) return full;
      if (found.name) return found.name;
    }
    if (/^[0-9a-fA-F]{24}$/.test(teacher)) return '';
    return teacher;
  }
  return '';
}

/**
 * Helper to safely resolve room name
 */
export function getRoomName(room, rooms = []) {
  if (!room) return '';
  if (typeof room === 'object') {
    return room.name || room.roomNumber || '';
  }
  if (typeof room === 'string') {
    const found = rooms.find((r) => r._id === room || r.id === room);
    if (found) return found.name || found.roomNumber || '';
    if (/^[0-9a-fA-F]{24}$/.test(room)) return '';
    return room;
  }
  return '';
}

/**
 * RGB color helper
 */
function hexToRgb(hex) {
  let c = String(hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Subject category theme mapping for colorful paper-friendly PDF output
 */
const SUBJECT_THEMES = {
  art: {
    bg: '#FFE4E6',
    border: '#FDA4AF',
    text: '#881337',
    badgeBg: '#F43F5E',
    badgeText: 'A',
  },
  computer: {
    bg: '#E0F2FE',
    border: '#7DD3FC',
    text: '#0C4A6E',
    badgeBg: '#0284C7',
    badgeText: 'C',
  },
  science: {
    bg: '#FEF3C7',
    border: '#FCD34D',
    text: '#78350F',
    badgeBg: '#D97706',
    badgeText: 'S',
  },
  math: {
    bg: '#EEF2FF',
    border: '#A5B4FC',
    text: '#1E1B4B',
    badgeBg: '#4F46E5',
    badgeText: 'M',
  },
  pe: {
    bg: '#D1FAE5',
    border: '#6EE7B7',
    text: '#064E3B',
    badgeBg: '#059669',
    badgeText: 'P',
  },
  social: {
    bg: '#F3E8FF',
    border: '#D8B4FE',
    text: '#4C1D95',
    badgeBg: '#9333EA',
    badgeText: 'SS',
  },
  english: {
    bg: '#D1FAE5',
    border: '#6EE7B7',
    text: '#064E3B',
    badgeBg: '#10B981',
    badgeText: 'E',
  },
  hindi: {
    bg: '#FFEDD5',
    border: '#FDBA74',
    text: '#7C2D12',
    badgeBg: '#EA580C',
    badgeText: 'H',
  },
  marathi: {
    bg: '#FCE7F3',
    border: '#F472B6',
    text: '#831843',
    badgeBg: '#DB2777',
    badgeText: 'MR',
  },
  gk: {
    bg: '#EDE9FE',
    border: '#C4B5FD',
    text: '#3B0764',
    badgeBg: '#7C3AED',
    badgeText: 'GK',
  },
  music: {
    bg: '#FDF2F8',
    border: '#FBCFE8',
    text: '#831843',
    badgeBg: '#DB2777',
    badgeText: 'MU',
  },
  default: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#064E3B',
    badgeBg: '#10B981',
    badgeText: 'S',
  },
};

function getSubjectTheme(subjectName = '') {
  const name = String(subjectName).toLowerCase().trim();
  if (name.includes('math') || name.includes('algebra') || name.includes('geometry') || name.includes('calc')) {
    return SUBJECT_THEMES.math;
  }
  if (name.includes('computer') || name.includes('code') || name.includes('it') || name.includes('tech') || name.includes('program')) {
    return SUBJECT_THEMES.computer;
  }
  if (name.includes('science') || name.includes('physics') || name.includes('chem') || name.includes('bio') || name.includes('lab')) {
    return SUBJECT_THEMES.science;
  }
  if (name.includes('art') || name.includes('craft') || name.includes('draw') || name.includes('paint')) {
    return SUBJECT_THEMES.art;
  }
  if (name.includes('pe') || name.includes('physical') || name.includes('sport') || name.includes('pt') || name.includes('gym') || name.includes('yoga')) {
    return SUBJECT_THEMES.pe;
  }
  if (name.includes('social') || name.includes('history') || name.includes('geography') || name.includes('civics') || name.includes('sst')) {
    return SUBJECT_THEMES.social;
  }
  if (name.includes('english')) {
    return SUBJECT_THEMES.english;
  }
  if (name.includes('hindi')) {
    return SUBJECT_THEMES.hindi;
  }
  if (name.includes('marathi')) {
    return SUBJECT_THEMES.marathi;
  }
  if (name.includes('music') || name.includes('singing') || name.includes('dance')) {
    return SUBJECT_THEMES.music;
  }
  if (name.includes('gk') || name.includes('general knowledge') || name.includes('moral')) {
    return SUBJECT_THEMES.gk;
  }
  return SUBJECT_THEMES.default;
}

const DAY_HEADER_THEMES = [
  { value: 1, label: 'MONDAY', bg: '#D1FAE5', border: '#A7F3D0', text: '#065F46' },
  { value: 2, label: 'TUESDAY', bg: '#DBEAFE', border: '#BFDBFE', text: '#1E40AF' },
  { value: 3, label: 'WEDNESDAY', bg: '#F3E8FF', border: '#E9D5FF', text: '#6B21A8' },
  { value: 4, label: 'THURSDAY', bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' },
  { value: 5, label: 'FRIDAY', bg: '#FFE4E6', border: '#FECDD3', text: '#9F1239' },
  { value: 6, label: 'SATURDAY', bg: '#EDE9FE', border: '#DDD6FE', text: '#5B21B6' },
];

/**
 * Universal Role-Aware Timetable PDF Exporter
 * Generates a colorful, paper-optimized, vector A4 landscape PDF matching the reference design.
 */
export function generateUniversalTimetablePdf({
  role = 'admin',
  activeTimetable,
  timetable,
  student,
  teacherUser,
  teacherSchedule = [],
  displayPeriods = [],
  daysList = [],
  periodCount = 8,
  subjects = [],
  teachers = [],
  rooms = [],
  configSnapshot = {},
  classMap = {},
  sectionMap = {},
}) {
  const doc = new jsPDF('landscape', 'mm', 'A4');
  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 12;

  // Resolve Context Data
  let activeTt = timetable || activeTimetable;
  let className = '';
  let sectionName = '';
  let studentName = '';
  let teacherName = '';
  let periods = [];
  let totalP = periodCount;
  let workingDays = [1, 2, 3, 4, 5, 6];
  let periodTimings = configSnapshot?.periodTimings || activeTt?.configSnapshot?.periodTimings || DEFAULT_PERIOD_TIMES;
  let breakPeriods = configSnapshot?.breakPeriods || activeTt?.configSnapshot?.breakPeriods || [];

  if (role === 'parent' || role === 'student') {
    className = student?.currentClass?.name || activeTt?.schoolClass?.name || 'Class';
    sectionName = student?.currentSection?.name || activeTt?.section?.name || 'Section';
    studentName = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '';
    periods = activeTt?.periods || displayPeriods || [];
    totalP = activeTt?.totalPeriodsPerDay || periodCount || 8;
    workingDays = activeTt?.configSnapshot?.workingDays || [1, 2, 3, 4, 5];
  } else if (role === 'teacher') {
    teacherName = teacherUser?.name || 'Faculty Member';
    periods = teacherSchedule || [];
    totalP = periods.length > 0 ? Math.max(8, ...periods.map((s) => s.periodNo || 1)) : 8;
    workingDays = [1, 2, 3, 4, 5, 6];
  } else {
    // Admin
    className = activeTt?.schoolClass?.name || classMap[activeTt?.schoolClass] || 'Class';
    sectionName = activeTt?.section?.name || sectionMap[activeTt?.section] || 'Section';
    periods = displayPeriods.length > 0 ? displayPeriods : activeTt?.periods || [];
    totalP = activeTt?.totalPeriodsPerDay || periodCount || 8;
    workingDays = configSnapshot?.workingDays || [1, 2, 3, 4, 5];
  }

  // Filter Day List
  const activeDays = DAY_HEADER_THEMES.filter((d) => workingDays.includes(d.value));
  if (daysList.length > 0 && activeDays.length === 0) {
    daysList.forEach((dl) => {
      const found = DAY_HEADER_THEMES.find((d) => d.value === dl.value);
      if (found) activeDays.push(found);
      else activeDays.push({ value: dl.value, label: dl.label.toUpperCase(), bg: '#E2E8F0', border: '#CBD5E1', text: '#1E293B' });
    });
  }

  // -------------------------------------------------------------
  // 1. BRAND HEADER (Top Bar)
  // -------------------------------------------------------------
  // Left: Instique Logo Badge & Brand Text
  doc.setFillColor(...hexToRgb('#10B981'));
  doc.roundedRect(marginX, 10, 11, 11, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('I', marginX + 3.8, 17.5);

  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb('#0F172A'));
  doc.text('Instique', marginX + 14, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#64748B'));
  doc.text('School Management', marginX + 14, 20.5);

  // Center: CLASS TIMETABLE Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb('#0F172A'));
  const headerTitle = role === 'teacher' ? 'TEACHER TIMETABLE' : 'CLASS TIMETABLE';
  doc.text(headerTitle, pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#475569'));
  doc.text('Academic Year 2026–2027', pageWidth / 2, 21, { align: 'center' });

  // Accent Line under title
  doc.setFillColor(...hexToRgb('#10B981'));
  doc.roundedRect(pageWidth / 2 - 8, 23, 16, 1.2, 0.6, 0.6, 'F');

  // Right: Generated Timestamp Card
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const timestampStr = `${dateFormatted} ${timeFormatted}`;

  const tsBoxW = 46;
  const tsBoxX = pageWidth - marginX - tsBoxW;
  doc.setFillColor(...hexToRgb('#F1F5F9'));
  doc.roundedRect(tsBoxX, 10, tsBoxW, 13, 3, 3, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#64748B'));
  doc.text('Generated on', tsBoxX + tsBoxW - 4, 14.5, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb('#0F172A'));
  doc.text(timestampStr, tsBoxX + tsBoxW - 4, 19.5, { align: 'right' });

  // -------------------------------------------------------------
  // 2. INFORMATION PANEL (Role Context Bar)
  // -------------------------------------------------------------
  const panelY = 27;
  const panelH = 14;
  const panelW = pageWidth - marginX * 2;

  doc.setFillColor(...hexToRgb('#F8FAFC'));
  doc.setDrawColor(...hexToRgb('#E2E8F0'));
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, panelY, panelW, panelH, 3.5, 3.5, 'FD');

  let col1X = marginX + 6;
  let col2X = marginX + 80;
  let col3X = marginX + 165;

  // Block 1: School Name
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#64748B'));
  doc.text('School', col1X, panelY + 4.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb('#0F172A'));
  doc.text('INSTIQUE SCHOOL MANAGEMENT', col1X, panelY + 9);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#64748B'));
  doc.text('Excellence in Education', col1X + 54, panelY + 9);

  // Block 2: Student or Educator
  if (role === 'teacher') {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb('#64748B'));
    doc.text('Educator / Teacher', col2X, panelY + 4.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb('#0F172A'));
    doc.text(teacherName, col2X, panelY + 9);
  } else {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb('#64748B'));
    doc.text('Student', col2X, panelY + 4.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb('#0F172A'));
    doc.text(studentName || 'Student Profile', col2X, panelY + 9);
  }

  // Block 3: Class & Section
  if (role !== 'teacher') {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb('#64748B'));
    doc.text('Class & Section', col3X, panelY + 4.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb('#0F172A'));
    doc.text(`${className} - ${sectionName}`, col3X, panelY + 9);
  }

  // Right Badge Pill inside Information Panel
  const badgeW = 42;
  const badgeX = marginX + panelW - badgeW - 4;
  doc.setFillColor(...hexToRgb('#D1FAE5'));
  doc.roundedRect(badgeX, panelY + 3, badgeW, 8, 4, 4, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb('#065F46'));
  doc.text('CLASS TIMETABLE', badgeX + badgeW / 2, panelY + 6.8, { align: 'center' });

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#047857'));
  doc.text('Official Class Schedule', badgeX + badgeW / 2, panelY + 9.8, { align: 'center' });

  // -------------------------------------------------------------
  // 3. TIMETABLE GRID
  // -------------------------------------------------------------
  const gridY = 44;
  const gridW = pageWidth - marginX * 2; // 273mm
  const col0W = 28; // Period column
  const dayColCount = activeDays.length;
  const dayColW = (gridW - col0W) / dayColCount; // ~40.8mm per day

  const headerH = 8.5;
  const footerH = 10;
  const availH = pageHeight - gridY - headerH - footerH - 12; // ~136mm available
  const rowH = Math.min(15.5, availH / Math.max(1, totalP));

  // --- Grid Headers ---
  // Period Header Box
  doc.setFillColor(...hexToRgb('#1E293B'));
  doc.roundedRect(marginX, gridY, col0W - 1.5, headerH, 2.5, 2.5, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PERIOD', marginX + (col0W - 1.5) / 2, gridY + 5.5, { align: 'center' });

  // Day Headers
  activeDays.forEach((dayObj, idx) => {
    const dX = marginX + col0W + idx * dayColW + 0.8;
    const dW = dayColW - 1.6;

    doc.setFillColor(...hexToRgb(dayObj.bg));
    doc.setDrawColor(...hexToRgb(dayObj.border));
    doc.setLineWidth(0.3);
    doc.roundedRect(dX, gridY, dW, headerH, 2.5, 2.5, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(dayObj.text));
    doc.text(dayObj.label, dX + dW / 2, gridY + 5.5, { align: 'center' });
  });

  // --- Grid Rows (P1 .. P_totalP) ---
  for (let i = 1; i <= totalP; i++) {
    const currY = gridY + headerH + (i - 1) * rowH + 1.2;
    const currH = rowH - 1.6;
    const isBreak = breakPeriods.includes(i);
    const pTime = periodTimings.find((pt) => (pt.periodNo || pt.pNo) === i) || DEFAULT_PERIOD_TIMES[i - 1] || {};
    const timeStr = pTime.startTime && pTime.endTime ? `${pTime.startTime} – ${pTime.endTime}` : (pTime.start && pTime.end ? `${pTime.start} – ${pTime.end}` : '');

    // Period Column Cell
    doc.setFillColor(...hexToRgb('#F8FAFC'));
    doc.setDrawColor(...hexToRgb('#E2E8F0'));
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, currY, col0W - 1.5, currH, 2.5, 2.5, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb('#0F172A'));
    doc.text(`P${i}`, marginX + 3.5, currY + (timeStr ? 5.5 : currH / 2 + 1.5));

    if (timeStr) {
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...hexToRgb('#64748B'));
      doc.text(timeStr, marginX + 3.5, currY + 10);
    }

    // Day Cells
    activeDays.forEach((dayObj, dIdx) => {
      const cX = marginX + col0W + dIdx * dayColW + 0.8;
      const cW = dayColW - 1.6;

      if (isBreak) {
        // Break Cell
        doc.setFillColor(...hexToRgb('#FEF3C7'));
        doc.setDrawColor(...hexToRgb('#FDE68A'));
        doc.setLineWidth(0.3);
        doc.roundedRect(cX, currY, cW, currH, 2.5, 2.5, 'FD');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...hexToRgb('#92400E'));
        doc.text('— Break —', cX + cW / 2, currY + currH / 2 + 1.5, { align: 'center' });
        return;
      }

      // Resolve Period Data
      let periodData = null;

      if (role === 'teacher') {
        periodData = periods.find((s) => s.day === dayObj.value && s.periodNo === i);
      } else {
        periodData = periods.find((p) => p.day === dayObj.value && p.periodNo === i);
      }

      if (!periodData) {
        // Free Period Cell
        doc.setFillColor(...hexToRgb('#F8FAFC'));
        doc.setDrawColor(...hexToRgb('#E2E8F0'));
        doc.setLineWidth(0.2);
        doc.roundedRect(cX, currY, cW, currH, 2.5, 2.5, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...hexToRgb('#94A3B8'));
        doc.text('— Free Period —', cX + cW / 2, currY + currH / 2 + 1.5, { align: 'center' });
        return;
      }

      if (periodData.isLunch || periodData.isBreak || periodData.isAssembly || periodData.isFixed) {
        // Custom Break / Fixed Slot
        doc.setFillColor(...hexToRgb('#FEF3C7'));
        doc.setDrawColor(...hexToRgb('#FDE68A'));
        doc.setLineWidth(0.3);
        doc.roundedRect(cX, currY, cW, currH, 2.5, 2.5, 'FD');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...hexToRgb('#92400E'));
        doc.text(periodData.label || 'Break', cX + cW / 2, currY + currH / 2 + 1.5, { align: 'center' });
        return;
      }

      // Subject Assignment Cell
      const subName = getSubjectName(periodData.subject, subjects) || periodData.subject?.name || 'Subject';
      const tchName = getTeacherName(periodData.teacher, teachers) || (periodData.teacher ? `${periodData.teacher.firstName || ''} ${periodData.teacher.lastName || ''}`.trim() : '');
      const roomName = getRoomName(periodData.room, rooms) || periodData.room || '';
      const clsSecText = periodData.schoolClass ? `${periodData.schoolClass.name || ''} - ${periodData.section?.name || ''}` : '';

      const theme = getSubjectTheme(subName);

      doc.setFillColor(...hexToRgb(theme.bg));
      doc.setDrawColor(...hexToRgb(theme.border));
      doc.setLineWidth(0.3);
      doc.roundedRect(cX, currY, cW, currH, 2.5, 2.5, 'FD');

      // Small Badge Icon Box inside Cell
      doc.setFillColor(...hexToRgb(theme.badgeBg));
      doc.roundedRect(cX + 2.5, currY + 2.5, 5, 5, 1.2, 1.2, 'F');

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(theme.badgeText.substring(0, 2), cX + 5, currY + 6.1, { align: 'center' });

      // Subject Title
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(theme.text));
      const subLines = doc.splitTextToSize(subName, cW - 10);
      doc.text(subLines[0] || subName, cX + 9, currY + 6.2);

      // Line 2: Teacher or Class
      const secondLine = role === 'teacher' ? (clsSecText ? `Class: ${clsSecText}` : tchName) : tchName;
      if (secondLine) {
        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'medium');
        doc.setTextColor(...hexToRgb('#475569'));
        const tchLines = doc.splitTextToSize(secondLine, cW - 5);
        doc.text(tchLines[0], cX + 3, currY + 10.2);
      }

      // Line 3: Room Number
      if (roomName) {
        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...hexToRgb('#64748B'));
        doc.text(`Rm: ${roomName}`, cX + 3, currY + 13.5);
      }
    });
  }

  // -------------------------------------------------------------
  // 4. FOOTER BAR
  // -------------------------------------------------------------
  const footerY = pageHeight - 12;

  // Left Note Box
  doc.setFillColor(...hexToRgb('#ECFDF5'));
  doc.setDrawColor(...hexToRgb('#A7F3D0'));
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, footerY, 175, 7.5, 2.5, 2.5, 'FD');

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb('#065F46'));
  doc.text('Note:', marginX + 3, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#047857'));
  doc.text('Timetable is subject to change. Please check regularly for updates.', marginX + 11, footerY + 5);

  // Center Motto
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#64748B'));
  doc.text('Learn   •   Grow   •   Excel', 212, footerY + 5, { align: 'center' });

  // Far Right Brand Text
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb('#0F172A'));
  doc.text('INSTIQUE', pageWidth - marginX - 25, footerY + 4, { align: 'right' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#64748B'));
  doc.text('School Management', pageWidth - marginX, footerY + 4, { align: 'right' });

  // -------------------------------------------------------------
  // 5. SAVE DYNAMIC FILENAME
  // -------------------------------------------------------------
  const dateStr = now.toISOString().split('T')[0];

  function sanitize(str) {
    return String(str || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
  }

  let fileIdentifier = 'Schedule';
  if (role === 'parent' || role === 'student') {
    fileIdentifier = studentName ? sanitize(studentName) : `${sanitize(className)}-${sanitize(sectionName)}`;
  } else if (role === 'teacher') {
    fileIdentifier = `Teacher-${sanitize(teacherName)}`;
  } else {
    fileIdentifier = `${sanitize(className)}-${sanitize(sectionName)}`;
  }

  const fileName = `Instique_Timetable_${fileIdentifier}_${dateStr}.pdf`;
  doc.save(fileName);
}

/**
 * Backwards compatibility alias for existing generateTimetablePdf callers
 */
export function generateTimetablePdf(options) {
  return generateUniversalTimetablePdf(options);
}
