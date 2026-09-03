import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    // If it's a 24-char ObjectId hex string and not found, hide the raw ID
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
 * Generates a PDF of the timetable using actual resolved data.
 */
export function generateTimetablePdf({
  activeTimetable,
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

  const tableColumn = ['Period', ...daysList.map((d) => d.label)];
  const periodTimings = configSnapshot?.periodTimings || DEFAULT_PERIOD_TIMES;
  const breakPeriods = configSnapshot?.breakPeriods || [];

  const tableRows = [];
  for (let i = 1; i <= periodCount; i++) {
    const isBreak = breakPeriods.includes(i);
    const pTime = periodTimings.find((pt) => (pt.periodNo || pt.pNo) === i) || DEFAULT_PERIOD_TIMES[i - 1] || {};
    const timingStr = (pTime.startTime || pTime.start) && (pTime.endTime || pTime.end)
      ? `\n(${pTime.startTime || pTime.start} - ${pTime.endTime || pTime.end})`
      : '';
    const rowHeader = `P${i}${timingStr}`;

    const row = [rowHeader];

    daysList.forEach((d) => {
      if (isBreak) {
        row.push('☕ Break');
        return;
      }

      const p = displayPeriods.find((gp) => gp.day === d.value && gp.periodNo === i);
      if (!p) {
        row.push('—');
        return;
      }

      const subName = getSubjectName(p.subject, subjects);
      const tchName = getTeacherName(p.teacher, teachers);
      const roomName = getRoomName(p.room, rooms);

      const parts = [];
      if (subName) parts.push(subName);
      if (tchName) parts.push(tchName);
      if (roomName) parts.push(`Rm: ${roomName}`);

      row.push(parts.length > 0 ? parts.join('\n') : '—');
    });

    tableRows.push(row);
  }

  // Header Info
  const className = activeTimetable?.schoolClass?.name || classMap[activeTimetable?.schoolClass] || 'Class';
  const sectionName = activeTimetable?.section?.name || sectionMap[activeTimetable?.section] || 'Section';

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Instique Timetable', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Class: ${className}   |   Section: ${sectionName}   |   Exported: ${new Date().toLocaleDateString()}`, 14, 22);

  // Invoke autoTable with fallback support for all module systems
  const runAutoTable = typeof autoTable === 'function' ? autoTable : (autoTable?.default || autoTable);

  const autoTableOptions = {
    startY: 27,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
      halign: 'center',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [34, 139, 87],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [245, 247, 248], cellWidth: 32 },
    },
  };

  if (typeof doc.autoTable === 'function') {
    doc.autoTable(autoTableOptions);
  } else if (typeof runAutoTable === 'function') {
    runAutoTable(doc, autoTableOptions);
  } else {
    console.error('jsPDF autoTable plugin not available');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const safeClass = String(className).replace(/[^a-zA-Z0-9]/g, '_');
  const safeSection = String(sectionName).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Instique_Timetable_${safeClass}_${safeSection}_${dateStr}.pdf`;

  doc.save(fileName);
}

