import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Download, BookOpen, User, Users, Coffee, EyeOff } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { useUserStore } from '../../store/userStore';
import { parentApi } from '../../api/parent.api';
import { studentApi } from '../../api/student.api';
import { timetableApi } from '../../api/timetable.api';
import { settingApi } from '../../api/setting.api';
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

export default function ParentTimetable() {
  const user = useUserStore((s) => s.user);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedChild, setSelectedChild] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModuleDisabled, setIsModuleDisabled] = useState(false);

  useEffect(() => {
    loadParentProfile();
  }, []);

  const loadParentProfile = async () => {
    setLoading(true);
    try {
      const [kidsRes, settingsRes] = await Promise.allSettled([
        parentApi.getMyChildren(),
        settingApi.getPublic()
      ]);
      if (settingsRes.status === 'fulfilled') {
        const sData = settingsRes.value?.data?.data || settingsRes.value?.data;
        if (sData?.visibility?.parent?.timetable === false || sData?.features?.timetable === false) {
          setIsModuleDisabled(true);
        }
      }
      if (kidsRes.status === 'fulfilled') {
        const kids = kidsRes.value?.data || [];
        setChildren(kids);
        if (kids.length > 0) {
          setSelectedChildId(kids[0].id || kids[0]._id);
        }
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

  const handleDownloadPdf = async () => {
    if (!timetable || !selectedChild) return;
    setIsDownloading(true);
    try {
      generateUniversalTimetablePdf({
        role: 'parent',
        timetable,
        student: selectedChild,
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

  if (!loading && isModuleDisabled) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center p-8 bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl shadow-xs space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <EyeOff size={28} />
        </div>
        <h2 className="text-lg font-bold text-deep dark:text-dark-text">Timetable Portal Disabled</h2>
        <p className="text-xs text-muted max-w-md mx-auto">
          Viewing student class timetables is currently disabled for parents by your school administrator.
        </p>
        <div className="pt-2">
          <Button onClick={() => window.location.href = '/dashboard'} variant="primary" size="sm">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12 print:p-0 print-timetable">
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
              )}
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
        {selectedChild && (
          <div className="mt-1.5 pt-1.5 border-t border-indigo-200/60 flex items-center justify-between text-[10px] text-slate-800 font-medium">
            <div>
              <span className="text-slate-500">Student: </span>
              <strong className="text-indigo-950 font-bold">{selectedChild.firstName} {selectedChild.lastName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Class & Section: </span>
              <strong className="text-indigo-950 font-bold">{selectedChild.currentClass?.name || 'Class'} - {selectedChild.currentSection?.name || 'Section'}</strong>
            </div>
          </div>
        )}
      </div>

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
