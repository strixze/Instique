import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Printer, BookOpen, User, Users, Coffee } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { useUserStore } from '../../store/userStore';
import { parentApi } from '../../api/parent.api';
import { studentApi } from '../../api/student.api';
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

export default function ParentTimetable() {
  const user = useUserStore((s) => s.user);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedChild, setSelectedChild] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentProfile();
  }, []);

  const loadParentProfile = async () => {
    setLoading(true);
    try {
      const res = await parentApi.getMyChildren();
      const kids = res.data || [];
      setChildren(kids);
      if (kids.length > 0) {
        setSelectedChildId(kids[0].id || kids[0]._id);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to load children profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedChildId) {
      setTimetable(null);
      setSelectedChild(null);
      return;
    }
    loadChildTimetable();
  }, [selectedChildId]);

  const loadChildTimetable = async () => {
    setLoading(true);
    try {
      const studRes = await studentApi.getById(selectedChildId);
      const kidProfile = studRes.data;
      setSelectedChild(kidProfile);

      if (kidProfile?.currentClass?._id && kidProfile?.currentSection?._id) {
        const ttRes = await timetableApi.getByClassSection(
          kidProfile.currentClass._id,
          kidProfile.currentSection._id
        );
        setTimetable(ttRes.data);
      } else {
        setTimetable(null);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to load timetable for selected child');
      setTimetable(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const maxPeriods = timetable?.totalPeriodsPerDay || 8;
  const workingDays = timetable?.configSnapshot?.workingDays || [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 w-full pb-12 print:p-0">
      <div className="print:hidden">
        <PageHeader
          title="Child's Class Timetable"
          description="Track your child's weekly lecture schedule, subjects, teachers, and classrooms."
          action={
            <div className="flex items-center gap-3">
              {children.length > 1 && (
                <Select
                  className="w-48 bg-white dark:bg-[#15191C] border-border dark:border-white/10"
                  options={children.map((c) => ({ value: c.id || c._id, label: `${c.firstName} ${c.lastName}` }))}
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                />
              )}
              {timetable && (
                <Button variant="outline" onClick={handlePrint} className="dark:bg-[#15191C] dark:border-white/10 dark:text-slate-200">
                  <Printer size={16} className="mr-2" /> Print Timetable
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Print header */}
      {selectedChild && (
        <div className="hidden print:block text-center border-b border-border pb-4 mb-6">
          <h1 className="text-2xl font-bold text-deep">
            Class Timetable: {selectedChild.currentClass?.name} - {selectedChild.currentSection?.name}
          </h1>
          <p className="text-sm text-muted">Student: {selectedChild.firstName} {selectedChild.lastName}</p>
        </div>
      )}

      {loading ? (
        <div className="h-60 flex items-center justify-center text-muted dark:text-slate-400">
          Loading child's timetable...
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-12 text-center text-muted dark:text-slate-400">
          <Users size={48} className="mx-auto mb-3 opacity-30 text-forest dark:text-emerald-400" />
          <span className="font-semibold text-secondary dark:text-slate-200">No Linked Students</span>
          <p className="text-xs text-muted dark:text-slate-400 mt-1">There are no children linked to your parent profile currently.</p>
        </div>
      ) : !timetable ? (
        <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-12 text-center text-muted dark:text-slate-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30 text-forest dark:text-emerald-400" />
          <span className="font-semibold text-secondary dark:text-slate-200">No Published Timetable</span>
          <p className="text-xs text-muted dark:text-slate-400 mt-1">There is no published schedule for {selectedChild?.firstName}'s class-section right now.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-5 shadow-2xl overflow-x-auto print:border-none print:shadow-none print:p-0 space-y-4">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-border/60 dark:border-white/10 bg-surface/70 dark:bg-[#101315] text-secondary dark:text-slate-400 uppercase tracking-wider text-xs">
                <th className="px-3.5 py-3 text-left font-bold text-deep dark:text-slate-200 w-28 print:text-secondary border-r border-border dark:border-white/10">
                  PERIOD
                </th>
                {workingDays.map((d) => (
                  <th key={d} className="px-3 py-3 text-center font-bold text-deep dark:text-slate-200 print:text-secondary border-r border-border dark:border-white/10">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar size={13} className="text-forest dark:text-emerald-400" />
                      <span>{(DAYS.find((day) => day.value === d)?.label || 'Day').toUpperCase()}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 dark:divide-white/[0.06] print:divide-gray-200">
              {Array.from({ length: maxPeriods }).map((_, idx) => {
                const pNo = idx + 1;
                const sampleSlot = timetable.periods?.find((p) => p.periodNo === pNo) || DEFAULT_PERIOD_TIMES[idx] || {};

                return (
                  <tr key={idx} className="hover:bg-surface/30 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-3.5 py-3.5 font-bold border-r border-border dark:border-white/10 bg-surface/40 dark:bg-[#101315] text-left select-none align-middle w-28">
                      <div className="font-extrabold text-sm text-deep dark:text-slate-200">P{pNo}</div>
                      <div className="text-[10px] text-muted dark:text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                        {sampleSlot.startTime || sampleSlot.start || '08:00'} – {sampleSlot.endTime || sampleSlot.end || '08:45'}
                      </div>
                    </td>
                    {workingDays.map((d) => {
                      const p = timetable.periods?.find((item) => item.day === d && item.periodNo === pNo);

                      if (!p) {
                        return (
                          <td key={d} className="px-2 py-2.5 border-r border-border dark:border-white/10 align-top">
                            <div className="h-full min-h-[64px] border border-dashed border-border/60 dark:border-white/[0.06] rounded-xl flex items-center justify-center text-muted/60 dark:text-slate-600 text-[11px] font-medium bg-surface/20 dark:bg-white/[0.01]">
                              — Free —
                            </div>
                          </td>
                        );
                      }

                      if (p.isLunch || p.isBreak || p.isAssembly || p.isFixed) {
                        return (
                          <td
                            key={d}
                            className="px-2 py-2.5 border-r border-border dark:border-white/10 bg-amber-50/30 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-semibold text-[11px] select-none text-center align-middle"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Coffee size={12} className="opacity-70" />
                              <span>{p.label || 'Break'}</span>
                            </div>
                          </td>
                        );
                      }

                      const style = getSubjectStyle(p.subject?.name);
                      const Icon = style.Icon;

                      return (
                        <td key={d} className="px-2 py-2.5 border-r border-border dark:border-white/10 align-top">
                          <div className={`bg-forest-soft/40 dark:bg-[#15191C] hover:dark:bg-[#181D20] border border-border/70 dark:border-white/[0.08] ${style.borderHover} rounded-xl p-2.5 space-y-1.5 text-left transition-all shadow-2xs hover:shadow-md dark:shadow-none group print:bg-sage-soft print:border-border print:text-deep`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${style.iconBox}`}>
                                <Icon size={13} />
                              </div>
                              <div className="font-bold text-xs text-deep dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors print:text-indigo-800">
                                {p.subject?.name || 'Subject'}
                              </div>
                            </div>
                            <div className="text-[11px] text-secondary dark:text-slate-400 font-medium truncate pl-0.5">
                              {p.teacher ? `${p.teacher.firstName} ${p.teacher.lastName}` : '—'}
                            </div>
                            {p.room && (
                              <div className="text-[10px] text-muted dark:text-slate-500 font-semibold pl-0.5">
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
          <div className="pt-1 text-xs text-forest dark:text-emerald-400/80 font-medium flex items-center gap-1.5">
            <span className="font-bold text-forest dark:text-emerald-400">Note:</span> Timetable is subject to change. Please check regularly for updates.
          </div>
        </div>
      )}
    </div>
  );
}
