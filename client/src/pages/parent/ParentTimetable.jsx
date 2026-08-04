import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Printer, BookOpen, User, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { useUserStore } from '../../store/userStore';
import { parentApi } from '../../api/parent.api';
import { studentApi } from '../../api/student.api';
import { timetableApi } from '../../api/timetable.api';

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
    if (!user || !user.profileId) {
      setLoading(false);
      return;
    }
    loadParentProfile();
  }, [user]);

  const loadParentProfile = async () => {
    setLoading(true);
    try {
      const res = await parentApi.getById(user.profileId);
      const kids = res.data?.students || [];
      setChildren(kids);
      if (kids.length > 0) {
        setSelectedChildId(kids[0]._id);
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
      // Fetch full student details (for class & section populate)
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:p-0">
      <div className="print:hidden">
        <PageHeader
          title="Child's Class Timetable"
          description="Track your child's weekly lecture schedule, subjects, teachers, and classrooms."
          action={
            <div className="flex items-center gap-3">
              {children.length > 1 && (
                <Select
                  className="w-48 bg-gray-900 border-gray-700"
                  options={children.map((c) => ({ value: c._id, label: `${c.firstName} ${c.lastName}` }))}
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                />
              )}
              {timetable && (
                <Button variant="outline" onClick={handlePrint}>
                  <Printer size={16} className="mr-2" /> Print Timetable
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Print header */}
      {selectedChild && (
        <div className="hidden print:block text-center border-b border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Class Timetable: {selectedChild.currentClass?.name} - {selectedChild.currentSection?.name}
          </h1>
          <p className="text-sm text-gray-500">Student: {selectedChild.firstName} {selectedChild.lastName}</p>
        </div>
      )}

      {loading ? (
        <div className="h-60 flex items-center justify-center text-gray-400">
          Loading child's timetable...
        </div>
      ) : children.length === 0 ? (
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-12 text-center text-gray-500">
          <Users size={48} className="mx-auto mb-3 opacity-30 text-indigo-400" />
          <span className="font-semibold text-gray-300">No Linked Students</span>
          <p className="text-xs text-gray-500 mt-1">There are no children linked to your parent profile currently.</p>
        </div>
      ) : !timetable ? (
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-12 text-center text-gray-500">
          <Calendar size={48} className="mx-auto mb-3 opacity-30 text-indigo-400" />
          <span className="font-semibold text-gray-300">No Published Timetable</span>
          <p className="text-xs text-gray-500 mt-1">There is no published schedule for {selectedChild?.firstName}'s class-section right now.</p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-2xl overflow-x-auto print:border-none print:shadow-none print:p-0">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-700/60 print:border-gray-300">
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-24 print:text-gray-700">
                  Period
                </th>
                {workingDays.map((d) => (
                  <th key={d} className="px-3 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider print:text-gray-700">
                    {DAYS.find((day) => day.value === d)?.label || 'Day'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50 print:divide-gray-200">
              {Array.from({ length: maxPeriods }).map((_, idx) => {
                const pNo = idx + 1;
                return (
                  <tr key={idx} className="hover:bg-gray-900/10">
                    <td className="px-3 py-4 font-bold text-gray-400 border-r border-gray-700/40 print:border-gray-200 print:text-gray-700">
                      <div>P{pNo}</div>
                      {timetable.periods?.find((p) => p.periodNo === pNo) && (
                        <div className="text-[10px] text-gray-500 font-normal mt-0.5 print:text-gray-600">
                          {timetable.periods.find((p) => p.periodNo === pNo).startTime || '—'} -{' '}
                          {timetable.periods.find((p) => p.periodNo === pNo).endTime || '—'}
                        </div>
                      )}
                    </td>
                    {workingDays.map((d) => {
                      const p = timetable.periods?.find((item) => item.day === d && item.periodNo === pNo);

                      if (!p) {
                        return (
                          <td key={d} className="px-2 py-3 border border-gray-700/35 print:border-gray-200 text-center text-gray-600 italic">
                            —
                          </td>
                        );
                      }

                      if (p.isLunch || p.isBreak || p.isAssembly || p.isFixed) {
                        return (
                          <td
                            key={d}
                            className="px-2 py-3 border border-gray-700/30 bg-gray-900/40 text-center font-semibold text-gray-500 select-none text-xs print:bg-gray-50"
                          >
                            {p.label || 'Break'}
                          </td>
                        );
                      }

                      return (
                        <td key={d} className="px-2 py-3 border border-gray-700/35 print:border-gray-200">
                          <div className="bg-gray-900/30 border border-gray-700/40 rounded-xl p-2.5 space-y-1 text-center print:bg-gray-100 print:border-gray-300 print:text-gray-900">
                            <div className="font-bold text-xs text-indigo-300 print:text-indigo-800 flex items-center justify-center gap-1">
                              <BookOpen size={11} className="opacity-70" />
                              {p.subject?.name || 'Subject'}
                            </div>
                            <div className="text-[10px] text-gray-300 print:text-gray-600 font-medium flex items-center justify-center gap-1">
                              <User size={10} className="opacity-70" />
                              {p.teacher ? `${p.teacher.firstName} ${p.teacher.lastName}` : '—'}
                            </div>
                            {p.room && (
                              <div className="text-[9px] text-gray-400 print:text-gray-500 font-semibold">
                                Room: {p.room}
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
        </div>
      )}
    </div>
  );
}
