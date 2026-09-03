import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Printer } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useUserStore } from '../../store/userStore';
import { timetableApi } from '../../api/timetable.api';
import { getSubjectStyle, DEFAULT_PERIOD_TIMES } from '../../utils/timetableTheme';

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

  const handlePrint = () => {
    window.print();
  };

  const maxPeriods = schedule.length > 0 ? Math.max(...schedule.map((s) => s.periodNo)) : 8;

  return (
    <div className="space-y-5 w-full pb-12 print:p-0">
      <div className="print:hidden">
        <PageHeader
          title="My Timetable Schedule"
          description="View your weekly lectures, classes, sections, and locations."
          action={
            <Button variant="outline" onClick={handlePrint} className="dark:bg-[#15191C] dark:border-white/10 dark:text-slate-200">
              <Printer size={16} className="mr-2" /> Print Schedule
            </Button>
          }
        />
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center border-b border-border pb-4 mb-6">
        <h1 className="text-2xl font-bold text-deep">{user?.name} - Teacher Timetable</h1>
        <p className="text-sm text-muted">Weekly Lecture Schedule</p>
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
        <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-5 shadow-2xl overflow-x-auto print:border-none print:shadow-none print:p-0 space-y-4">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-border/60 dark:border-white/10 bg-surface/70 dark:bg-[#101315] text-secondary dark:text-slate-400 uppercase tracking-wider text-xs">
                <th className="px-3.5 py-3 text-left font-bold text-deep dark:text-slate-200 w-28 print:text-secondary border-r border-border dark:border-white/10">
                  PERIOD
                </th>
                {DAYS.map((d) => (
                  <th key={d.value} className="px-3 py-3 text-center font-bold text-deep dark:text-slate-200 print:text-secondary border-r border-border dark:border-white/10">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar size={13} className="text-forest dark:text-emerald-400" />
                      <span>{d.label.toUpperCase()}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 dark:divide-white/[0.06] print:divide-gray-200">
              {Array.from({ length: Math.max(8, maxPeriods) }).map((_, idx) => {
                const pNo = idx + 1;
                const sampleSlot = schedule.find((s) => s.periodNo === pNo) || DEFAULT_PERIOD_TIMES[idx] || {};

                return (
                  <tr key={idx} className="hover:bg-surface/30 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-3.5 py-3.5 font-bold border-r border-border dark:border-white/10 bg-surface/40 dark:bg-[#101315] text-left select-none align-middle w-28">
                      <div className="font-extrabold text-sm text-deep dark:text-slate-200">P{pNo}</div>
                      <div className="text-[10px] text-muted dark:text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                        {sampleSlot.startTime || sampleSlot.start || '08:00'} – {sampleSlot.endTime || sampleSlot.end || '08:45'}
                      </div>
                    </td>

                    {DAYS.map((d) => {
                      const lectures = schedule.filter((s) => s.day === d.value && s.periodNo === pNo);

                      return (
                        <td key={d.value} className="px-2 py-2.5 border-r border-border dark:border-white/10 align-top">
                          {lectures.length > 0 ? (
                            <div className="space-y-2">
                              {lectures.map((lec, lIdx) => {
                                const style = getSubjectStyle(lec.subject?.name);
                                const Icon = style.Icon;

                                return (
                                  <div
                                    key={lIdx}
                                    className={`bg-forest-soft/40 dark:bg-[#15191C] hover:dark:bg-[#181D20] border border-border/70 dark:border-white/[0.08] ${style.borderHover} rounded-xl p-2.5 space-y-1.5 transition-all shadow-2xs hover:shadow-md dark:shadow-none text-left group print:bg-sage-soft print:border-border print:text-deep`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${style.iconBox}`}>
                                        <Icon size={13} />
                                      </div>
                                      <div className="font-bold text-xs text-deep dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors print:text-indigo-800">
                                        {lec.subject?.name || 'Subject'}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-secondary dark:text-slate-400 font-medium truncate pl-0.5">
                                      <Clock size={10} className="opacity-70" />
                                      Class: {lec.schoolClass?.name} - {lec.section?.name}
                                    </div>
                                    {lec.room && (
                                      <div className="flex items-center gap-1.5 text-[9px] text-muted dark:text-slate-500 font-semibold pl-0.5">
                                        <MapPin size={9} className="opacity-70" />
                                        Rm: {lec.room}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-full min-h-[64px] border border-dashed border-border/60 dark:border-white/[0.06] rounded-xl flex items-center justify-center text-muted/60 dark:text-slate-600 text-[11px] font-medium bg-surface/20 dark:bg-white/[0.01]">
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
