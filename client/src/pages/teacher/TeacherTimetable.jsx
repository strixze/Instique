import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useUserStore } from '../../store/userStore';
import { timetableApi } from '../../api/timetable.api';
import { getSubjectStyle, DEFAULT_PERIOD_TIMES } from '../../utils/timetableTheme';
import { generateUniversalTimetablePdf } from '../../utils/timetablePdf';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function TeacherTimetable() {
  const user = useUserStore((s) => s.user);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!user || !user.profileId) {
      setLoading(false);
      return;
    }
    loadTeacherTimetable();
  }, [user]);

  const loadTeacherTimetable = async () => {
    setLoading(true);
    try {
      const res = await timetableApi.getTeacherTimetable(user.profileId);
      setSchedule(res.data || []);
    } catch (e) {
      toast.error(e?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!schedule) return;
    setIsDownloading(true);
    try {
      generateUniversalTimetablePdf({
        role: 'teacher',
        teacherSchedule: schedule,
        teacherUser: user,
      });
      toast.success('Timetable PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Unable to generate timetable PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const maxPeriods = schedule.length > 0 ? Math.max(...schedule.map((s) => s.periodNo)) : 8;

  return (
    <div className="space-y-5 w-full pb-12 print:p-0 print-timetable">
      <div className="print:hidden">
        <PageHeader
          title="My Timetable Schedule"
          description="View your weekly lectures, classes, sections, and locations."
          action={
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloading || schedule.length === 0}
                className="bg-forest hover:bg-forest/90 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-slate-950 font-semibold shadow-2xs gap-1.5"
              >
                <Download size={16} />
                {isDownloading ? 'Generating PDF...' : 'Download'}
              </Button>
            </div>
          }
        />
      </div>

      {/* Official Printable Header (Visible only when printing) */}
      <div className="print-only-header hidden border-b-2 border-indigo-500/30 pb-2 mb-2 bg-gradient-to-r from-slate-50 via-indigo-50/60 to-emerald-50/50 p-3 rounded-xl text-slate-900 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              I
            </div>
            <div className="text-left">
              <h1 className="text-sm font-extrabold text-indigo-950 tracking-tight leading-none uppercase">
                INSTIQUE SCHOOL MANAGEMENT
              </h1>
              <p className="text-[9px] font-semibold text-indigo-600 mt-0.5">
                Teacher Lecture Schedule • Academic Year 2026–2027
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 bg-indigo-600 text-white font-bold text-[9px] rounded-full uppercase tracking-wider">
              Teacher Timetable
            </span>
            <p className="text-[8px] text-slate-500 font-medium mt-0.5">
              Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="mt-1.5 pt-1.5 border-t border-indigo-200/60 flex items-center justify-between text-[10px] text-slate-800 font-medium">
          <div>
            <span className="text-slate-500">Educator: </span>
            <strong className="text-indigo-950 font-bold">{user?.name || 'Teacher'}</strong>
          </div>
          <div>
            <span className="text-slate-500">Role: </span>
            <strong className="text-indigo-950 font-bold">Faculty Member</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-60 flex items-center justify-center text-muted dark:text-slate-400">
          Loading your schedule...
        </div>
      ) : schedule.length === 0 ? (
        <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-12 text-center text-muted dark:text-slate-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30 text-forest dark:text-emerald-400" />
          <span className="font-semibold text-secondary dark:text-slate-200">No Assignments Yet</span>
          <p className="text-xs text-muted dark:text-slate-400 mt-1">You are not assigned to any timetable periods currently.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-5 shadow-2xl overflow-x-auto print:overflow-visible print:border-none print:shadow-none print:p-0 space-y-4 print:space-y-1">
          <table className="w-full text-sm border-collapse min-w-[720px] print:min-w-full">
            <thead>
              <tr className="border-b border-border/60 dark:border-white/10 bg-surface/70 dark:bg-[#101315] text-secondary dark:text-slate-400 uppercase tracking-wider text-xs print:bg-indigo-50/80 print:text-indigo-950 print:border-indigo-200">
                <th className="px-3.5 py-3 print:py-1 print:px-1.5 text-left font-bold text-deep dark:text-slate-200 w-28 print:w-20 print:text-indigo-950 border-r border-border dark:border-white/10 print:border-indigo-200">
                  PERIOD
                </th>
                {DAYS.map((d) => (
                  <th key={d.value} className="px-3 py-3 print:py-1 print:px-1.5 text-center font-bold text-deep dark:text-slate-200 print:text-indigo-950 border-r border-border dark:border-white/10 print:border-indigo-200">
                    <div className="flex items-center justify-center gap-1.5 print:gap-1">
                      <Calendar size={13} className="text-forest dark:text-emerald-400 print:hidden" />
                      <span>{d.label.toUpperCase()}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 dark:divide-white/[0.06] print:divide-slate-200">
              {Array.from({ length: Math.max(8, maxPeriods) }).map((_, idx) => {
                const pNo = idx + 1;
                const sampleSlot = schedule.find((s) => s.periodNo === pNo) || DEFAULT_PERIOD_TIMES[idx] || {};

                return (
                  <tr key={idx} className="hover:bg-surface/30 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-3.5 py-3.5 print:py-1 print:px-1.5 font-bold border-r border-border dark:border-white/10 bg-surface/40 dark:bg-[#101315] print:bg-slate-100/80 text-left select-none align-middle w-28 print:w-20 print:border-slate-200">
                      <div className="font-extrabold text-sm print:text-xs text-deep dark:text-slate-200 print:text-slate-900">P{pNo}</div>
                      <div className="text-[10px] print:text-[9px] text-muted dark:text-slate-400 print:text-slate-600 font-normal mt-0.5 whitespace-nowrap">
                        {sampleSlot.startTime || sampleSlot.start || '08:00'} – {sampleSlot.endTime || sampleSlot.end || '08:45'}
                      </div>
                    </td>

                    {DAYS.map((d) => {
                      const lectures = schedule.filter((s) => s.day === d.value && s.periodNo === pNo);

                      return (
                        <td key={d.value} className="px-2 py-2.5 print:py-0.5 print:px-1 border-r border-border dark:border-white/10 print:border-slate-200 align-top">
                          {lectures.length > 0 ? (
                            <div className="space-y-2 print:space-y-0.5">
                              {lectures.map((lec, lIdx) => {
                                const style = getSubjectStyle(lec.subject?.name);
                                const Icon = style.Icon;

                                return (
                                  <div
                                    key={lIdx}
                                    className={`bg-forest-soft/40 dark:bg-[#15191C] hover:dark:bg-[#181D20] border border-border/70 dark:border-white/[0.08] ${style.borderHover} rounded-xl p-2.5 print:p-1 space-y-1.5 print:space-y-0 transition-all shadow-2xs hover:shadow-md dark:shadow-none text-left group ${style.printBg || 'print:bg-emerald-50 print:border-emerald-300 print:text-emerald-950'}`}
                                  >
                                    <div className="flex items-center gap-2 print:gap-1">
                                      <div className={`w-6 h-6 print:w-3.5 print:h-3.5 rounded-lg flex items-center justify-center shrink-0 ${style.iconBox} print:bg-white print:border-current`}>
                                        <Icon size={13} className="print:w-2.5 print:h-2.5" />
                                      </div>
                                      <div className={`font-bold text-xs print:text-[10px] text-deep dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors ${style.printTitleColor || 'print:text-emerald-900'}`}>
                                        {lec.subject?.name || 'Subject'}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 print:gap-1 text-[10px] print:text-[9px] text-secondary dark:text-slate-400 print:text-slate-700 font-medium truncate pl-0.5">
                                      <Clock size={10} className="opacity-70 print:hidden" />
                                      Class: {lec.schoolClass?.name} - {lec.section?.name}
                                    </div>
                                    {lec.room && (
                                      <div className="flex items-center gap-1.5 print:gap-1 text-[9px] print:text-[8px] text-muted dark:text-slate-500 print:text-slate-600 font-semibold pl-0.5">
                                        <MapPin size={9} className="opacity-70 print:hidden" />
                                        Rm: {lec.room}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-full min-h-[64px] print:min-h-[32px] border border-dashed border-border/60 dark:border-white/[0.06] print:border-slate-200 rounded-xl flex items-center justify-center text-muted/60 dark:text-slate-600 print:text-slate-400 text-[11px] print:text-[9px] font-medium bg-surface/20 dark:bg-white/[0.01] print:bg-slate-50/50">
                              — Free —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Note */}
          <div className="pt-1 text-xs text-forest dark:text-emerald-400/80 font-medium flex items-center gap-1.5">
            <span className="font-bold text-forest dark:text-emerald-400">Note:</span> Timetable is subject to change. Please check regularly for updates.
          </div>
        </div>
      )}
    </div>
  );
}
