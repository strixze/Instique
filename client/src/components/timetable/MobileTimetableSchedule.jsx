import { useState } from 'react';
import { Calendar, Clock, MapPin, User, GraduationCap } from 'lucide-react';
import { getSubjectStyle, DEFAULT_PERIOD_TIMES } from '../../utils/timetableTheme';
import { uiSound } from '../../utils/soundManager';

const DAYS = [
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
];

export default function MobileTimetableSchedule({
  schedule = [],
  maxPeriods = 8,
  role = 'teacher', // 'teacher' | 'student' | 'parent' | 'admin'
}) {
  // Default to today if Monday-Saturday, otherwise Monday
  const todayDay = new Date().getDay();
  const initialDay = todayDay >= 1 && todayDay <= 6 ? todayDay : 1;
  const [selectedDay, setSelectedDay] = useState(initialDay);

  const periodsCount = Math.max(8, maxPeriods);

  return (
    <div className="space-y-4 md:hidden">
      {/* ── Day Selector Chips (Horizontally Scrollable) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((d) => {
          const isSelected = selectedDay === d.value;
          return (
            <button
              key={d.value}
              onClick={() => {
                uiSound.select?.();
                setSelectedDay(d.value);
              }}
              className={`flex-1 min-w-[50px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center shrink-0 ${
                isSelected
                  ? 'bg-forest dark:bg-emerald-500 text-white dark:text-gray-900 shadow-2xs scale-102'
                  : 'bg-white dark:bg-dark-card border border-border dark:border-dark-border text-secondary dark:text-dark-text-secondary hover:bg-surface dark:hover:bg-dark-hover'
              }`}
            >
              <div>{d.label}</div>
            </button>
          );
        })}
      </div>

      {/* ── Vertical Periods Schedule ── */}
      <div className="space-y-2.5">
        {Array.from({ length: periodsCount }).map((_, idx) => {
          const pNo = idx + 1;
          const lectures = schedule.filter((s) => s.day === selectedDay && s.periodNo === pNo);
          const sampleSlot = schedule.find((s) => s.periodNo === pNo) || DEFAULT_PERIOD_TIMES[idx] || {};
          const timeRange = `${sampleSlot.startTime || sampleSlot.start || '08:00'} – ${sampleSlot.endTime || sampleSlot.end || '08:45'}`;

          if (lectures.length === 0) {
            return (
              <div
                key={pNo}
                className="flex items-center justify-between p-3 rounded-xl border border-dashed border-border/80 dark:border-dark-border/60 bg-surface/30 dark:bg-dark-card/30 text-xs text-muted dark:text-dark-text-muted"
              >
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-deep dark:text-dark-text">P{pNo}</span>
                  <span>{timeRange}</span>
                </div>
                <span className="text-[11px] font-medium">— Free —</span>
              </div>
            );
          }

          return (
            <div key={pNo} className="space-y-2">
              {lectures.map((lec, lIdx) => {
                const subjectName = typeof lec.subject === 'string' ? lec.subject : (lec.subject?.name || 'Subject');
                const teacherName = typeof lec.teacher === 'string' ? lec.teacher : (lec.teacher?.name || `${lec.teacher?.firstName || ''} ${lec.teacher?.lastName || ''}`.trim());
                const className = typeof lec.schoolClass === 'string' ? lec.schoolClass : (lec.schoolClass?.name || '');
                const sectionName = typeof lec.section === 'string' ? lec.section : (lec.section?.name || '');
                const style = getSubjectStyle(subjectName);
                const Icon = style.Icon;

                return (
                  <div
                    key={lIdx}
                    className="p-3.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-2xs space-y-2"
                  >
                    {/* Period & Time Header */}
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/50 dark:border-dark-border/50">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-forest/10 dark:bg-emerald-500/15 text-forest dark:text-emerald-400 font-bold font-mono text-[11px]">
                          P{pNo}
                        </span>
                        <span className="text-muted dark:text-dark-text-muted font-medium text-[11px] flex items-center gap-1">
                          <Clock size={11} /> {timeRange}
                        </span>
                      </div>
                      {lec.room && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted dark:text-dark-text-muted bg-surface dark:bg-dark-hover px-2 py-0.5 rounded-md">
                          <MapPin size={10} /> Room {lec.room}
                        </span>
                      )}
                    </div>

                    {/* Subject Row */}
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.iconBox}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-deep dark:text-dark-text truncate">
                          {subjectName}
                        </p>
                        {role === 'teacher' && (className || sectionName) && (
                          <p className="text-xs text-secondary dark:text-dark-text-secondary flex items-center gap-1 mt-0.5">
                            <GraduationCap size={12} className="text-muted shrink-0" />
                            <span>Class: {className} {sectionName ? `(${sectionName})` : ''}</span>
                          </p>
                        )}
                        {(role === 'student' || role === 'parent') && teacherName && (
                          <p className="text-xs text-secondary dark:text-dark-text-secondary flex items-center gap-1 mt-0.5">
                            <User size={12} className="text-muted shrink-0" />
                            <span>Faculty: {teacherName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
