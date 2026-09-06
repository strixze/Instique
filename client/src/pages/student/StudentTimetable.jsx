import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Download, BookOpen, User, Coffee } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useUserStore } from '../../store/userStore';
import { studentApi } from '../../api/student.api';
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

export default function StudentTimetable() {
  const user = useUserStore((s) => s.user);
  const [studentProfile, setStudentProfile] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!user || !user.profileId) {
      setLoading(false);
      return;
    }
    loadStudentAndTimetable();
  }, [user]);

  const loadStudentAndTimetable = async () => {
    setLoading(true);
    try {
      // 1. Fetch student profile to get class and section
      const studRes = await studentApi.getById(user.profileId);
      const profile = studRes.data;
      setStudentProfile(profile);

      if (profile?.currentClass?._id && profile?.currentSection?._id) {
        // 2. Fetch timetable by class & section
        const ttRes = await timetableApi.getByClassSection(
          profile.currentClass._id,
          profile.currentSection._id
        );
        setTimetable(ttRes.data);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!timetable || !studentProfile) return;
    setIsDownloading(true);
    try {
      generateUniversalTimetablePdf({
        role: 'student',
        timetable,
        student: studentProfile,
        configSnapshot: timetable.configSnapshot,
      });
      toast.success('Timetable PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Unable to generate timetable PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const maxPeriods = timetable?.totalPeriodsPerDay || 8;
  const workingDays = timetable?.configSnapshot?.workingDays || [1, 2, 3, 4, 5];

  return (
    <div className="space-y-5 w-full pb-12 print:p-0 print-timetable">
      <div className="print:hidden">
        <PageHeader
          title="Class Timetable"
          description="View your daily period schedule, subjects, teachers, and classrooms."
          action={
            timetable && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="bg-forest hover:bg-forest/90 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-slate-950 font-semibold shadow-2xs gap-1.5"
                >
                  <Download size={16} />
                  {isDownloading ? 'Generating PDF...' : 'Download'}
                </Button>
              </div>
            )
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
                Official Class Schedule • Academic Year 2026–2027
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 bg-indigo-600 text-white font-bold text-[9px] rounded-full uppercase tracking-wider">
              Class Timetable
            </span>
            <p className="text-[8px] text-slate-500 font-medium mt-0.5">
              Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        {studentProfile && (
          <div className="mt-1.5 pt-1.5 border-t border-indigo-200/60 flex items-center justify-between text-[10px] text-slate-800 font-medium">
            <div>
              <span className="text-slate-500">Student: </span>
              <strong className="text-indigo-950 font-bold">{studentProfile.firstName} {studentProfile.lastName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Class & Section: </span>
              <strong className="text-indigo-950 font-bold">{studentProfile.currentClass?.name || 'Class'} - {studentProfile.currentSection?.name || 'Section'}</strong>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-60 flex items-center justify-center text-muted dark:text-slate-400">
          Loading class timetable...
        </div>
      ) : !timetable ? (
        <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-12 text-center text-muted dark:text-slate-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30 text-forest dark:text-emerald-400" />
          <span className="font-semibold text-secondary dark:text-slate-200">No Published Timetable</span>
          <p className="text-xs text-muted dark:text-slate-400 mt-1">There is no published schedule for your class-section right now.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-5 shadow-2xl overflow-x-auto print:overflow-visible print:border-none print:shadow-none print:p-0 space-y-4 print:space-y-1">
          <table className="w-full text-sm border-collapse min-w-[720px] print:min-w-full">
            <thead>
              <tr className="border-b border-border/60 dark:border-white/10 bg-surface/70 dark:bg-[#101315] text-secondary dark:text-slate-400 uppercase tracking-wider text-xs print:bg-indigo-50/80 print:text-indigo-950 print:border-indigo-200">
                <th className="px-3.5 py-3 print:py-1 print:px-1.5 text-left font-bold text-deep dark:text-slate-200 w-28 print:w-20 print:text-indigo-950 border-r border-border dark:border-white/10 print:border-indigo-200">
                  PERIOD
                </th>
                {workingDays.map((d) => (
                  <th key={d} className="px-3 py-3 print:py-1 print:px-1.5 text-center font-bold text-deep dark:text-slate-200 print:text-indigo-950 border-r border-border dark:border-white/10 print:border-indigo-200">
                    <div className="flex items-center justify-center gap-1.5 print:gap-1">
                      <Calendar size={13} className="text-forest dark:text-emerald-400 print:hidden" />
                      <span>{(DAYS.find((day) => day.value === d)?.label || 'Day').toUpperCase()}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 dark:divide-white/[0.06] print:divide-slate-200">
              {Array.from({ length: maxPeriods }).map((_, idx) => {
                const pNo = idx + 1;
                const sampleSlot = timetable.periods?.find((p) => p.periodNo === pNo) || DEFAULT_PERIOD_TIMES[idx] || {};

                return (
                  <tr key={idx} className="hover:bg-surface/30 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-3.5 py-3.5 print:py-1 print:px-1.5 font-bold border-r border-border dark:border-white/10 bg-surface/40 dark:bg-[#101315] print:bg-slate-100/80 text-left select-none align-middle w-28 print:w-20 print:border-slate-200">
                      <div className="font-extrabold text-sm print:text-xs text-deep dark:text-slate-200 print:text-slate-900">P{pNo}</div>
                      <div className="text-[10px] print:text-[9px] text-muted dark:text-slate-400 print:text-slate-600 font-normal mt-0.5 whitespace-nowrap">
                        {sampleSlot.startTime || sampleSlot.start || '08:00'} – {sampleSlot.endTime || sampleSlot.end || '08:45'}
                      </div>
                    </td>
                    {workingDays.map((d) => {
                      const p = timetable.periods?.find((item) => item.day === d && item.periodNo === pNo);

                      if (!p) {
                        return (
                          <td key={d} className="px-2 py-2.5 print:py-0.5 print:px-1 border-r border-border dark:border-white/10 print:border-slate-200 align-top">
                            <div className="h-full min-h-[64px] print:min-h-[32px] border border-dashed border-border/60 dark:border-white/[0.06] print:border-slate-200 rounded-xl flex items-center justify-center text-muted/60 dark:text-slate-600 print:text-slate-400 text-[11px] print:text-[9px] font-medium bg-surface/20 dark:bg-white/[0.01] print:bg-slate-50/50">
                              — Free —
                            </div>
                          </td>
                        );
                      }

                      if (p.isLunch || p.isBreak || p.isAssembly || p.isFixed) {
                        return (
                          <td
                            key={d}
                            className="px-2 py-2.5 print:py-0.5 print:px-1 border-r border-border dark:border-white/10 print:border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 print:bg-amber-100/80 text-amber-700 dark:text-amber-400 print:text-amber-950 font-semibold text-[11px] print:text-[9px] select-none text-center align-middle"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Coffee size={12} className="opacity-70 print:hidden" />
                              <span>{p.label || 'Break'}</span>
                            </div>
                          </td>
                        );
                      }

                      const style = getSubjectStyle(p.subject?.name);
                      const Icon = style.Icon;

                      return (
                        <td key={d} className="px-2 py-2.5 print:py-0.5 print:px-1 border-r border-border dark:border-white/10 print:border-slate-200 align-top">
                          <div className={`bg-forest-soft/40 dark:bg-[#15191C] hover:dark:bg-[#181D20] border border-border/70 dark:border-white/[0.08] ${style.borderHover} rounded-xl p-2.5 print:p-1 space-y-1.5 print:space-y-0 text-left transition-all shadow-2xs hover:shadow-md dark:shadow-none group ${style.printBg || 'print:bg-emerald-50 print:border-emerald-300 print:text-emerald-950'}`}>
                            <div className="flex items-center gap-2 print:gap-1">
                              <div className={`w-6 h-6 print:w-3.5 print:h-3.5 rounded-lg flex items-center justify-center shrink-0 ${style.iconBox} print:bg-white print:border-current`}>
                                <Icon size={13} className="print:w-2.5 print:h-2.5" />
                              </div>
                              <div className={`font-bold text-xs print:text-[10px] text-deep dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors ${style.printTitleColor || 'print:text-emerald-900'}`}>
                                {p.subject?.name || 'Subject'}
                              </div>
                            </div>
                            <div className="text-[11px] print:text-[9px] text-secondary dark:text-slate-400 print:text-slate-700 font-medium truncate pl-0.5">
                              {p.teacher ? `${p.teacher.firstName} ${p.teacher.lastName}` : '—'}
                            </div>
                            {p.room && (
                              <div className="text-[10px] print:text-[8px] text-muted dark:text-slate-500 print:text-slate-600 font-semibold pl-0.5">
                                Rm: {p.room}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Note */}
          <div className="pt-1 print:pt-0.5 text-xs print:text-[9px] text-forest dark:text-emerald-400/80 font-medium flex items-center gap-1.5">
            <span className="font-bold text-forest dark:text-emerald-400">Note:</span> Timetable is subject to change. Please check regularly for updates.
          </div>
        </div>
      )}
    </div>
  );
}
