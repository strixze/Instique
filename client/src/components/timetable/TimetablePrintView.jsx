import React from 'react';
import { getSubjectName, getTeacherName, getRoomName } from '../../utils/timetablePdf';
import { DEFAULT_PERIOD_TIMES } from '../../utils/timetableTheme';

export default function TimetablePrintView({
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
  if (!activeTimetable) return null;

  const className = activeTimetable?.schoolClass?.name || classMap[activeTimetable?.schoolClass] || 'Class';
  const sectionName = activeTimetable?.section?.name || sectionMap[activeTimetable?.section] || 'Section';
  const periodTimings = configSnapshot?.periodTimings || DEFAULT_PERIOD_TIMES;
  const breakPeriods = configSnapshot?.breakPeriods || [];

  return (
    <div className="print-timetable" style={{ padding: '8px 12px', fontFamily: 'sans-serif', color: '#000', backgroundColor: '#fff' }}>
      <div style={{ marginBottom: '0.4rem', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Instique School Management</h1>
        <h2 style={{ margin: '2px 0', fontSize: '1.05rem', color: '#334155' }}>Class Timetable</h2>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
          <strong>Class:</strong> {className} &nbsp;|&nbsp; <strong>Section:</strong> {sectionName}
        </p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9' }}>
            <th style={{ border: '1px solid #cbd5e1', padding: '4px 6px', width: '100px' }}>Period</th>
            {daysList.map((d) => (
              <th key={d.value} style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: periodCount }, (_, i) => i + 1).map((pNo) => {
            const isBreak = breakPeriods.includes(pNo);
            const pTime = periodTimings.find((pt) => (pt.periodNo || pt.pNo) === pNo) || DEFAULT_PERIOD_TIMES[pNo - 1] || {};

            return (
              <tr key={pNo}>
                <td style={{ border: '1px solid #cbd5e1', padding: '3px 5px', backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                  <div>P{pNo}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#64748b' }}>
                    {pTime.startTime || pTime.start || ''} – {pTime.endTime || pTime.end || ''}
                  </div>
                </td>
                {daysList.map((d) => {
                  if (isBreak) {
                    return (
                      <td key={d.value} style={{ border: '1px solid #cbd5e1', padding: '3px 5px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}>
                        Break
                      </td>
                    );
                  }

                  const p = displayPeriods.find((gp) => gp.day === d.value && gp.periodNo === pNo);
                  if (!p) {
                    return (
                      <td key={d.value} style={{ border: '1px solid #cbd5e1', padding: '3px 5px', color: '#94a3b8' }}>
                        —
                      </td>
                    );
                  }

                  const subName = getSubjectName(p.subject, subjects);
                  const tchName = getTeacherName(p.teacher, teachers);
                  const roomName = getRoomName(p.room, rooms);

                  return (
                    <td key={d.value} style={{ border: '1px solid #cbd5e1', padding: '3px 5px', textAlign: 'left', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.8rem' }}>{subName || '—'}</div>
                      {tchName && <div style={{ fontSize: '0.75rem', color: '#475569' }}>{tchName}</div>}
                      {roomName && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Rm: {roomName}</div>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

