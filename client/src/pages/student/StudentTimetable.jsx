import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Printer, BookOpen, User } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useUserStore } from '../../store/userStore';
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

export default function StudentTimetable() {
  const user = useUserStore((s) => s.user);
  const [studentProfile, setStudentProfile] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handlePrint = () => {
    window.print();
  };

  const maxPeriods = timetable?.totalPeriodsPerDay || 8;
  const workingDays = timetable?.configSnapshot?.workingDays || [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:p-0">
      <div className="print:hidden">
        <PageHeader
          title="Class Timetable"
          description="View your daily period schedule, subjects, teachers, and classrooms."
          action={
            timetable && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer size={16} className="mr-2" /> Print Schedule
              </Button>
            )
          }
        />
      </div>

      {/* Print header */}
      {studentProfile && (
        <div className="hidden print:block text-center border-b border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Class Timetable: {studentProfile.currentClass?.name} - {studentProfile.currentSection?.name}
          </h1>
          <p className="text-sm text-gray-500">Student: {studentProfile.firstName} {studentProfile.lastName}</p>
        </div>
      )}

      {loading ? (
        <div className="h-60 flex items-center justify-center text-gray-400">
          Loading class timetable...
        </div>
      ) : !timetable ? (
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-12 text-center text-gray-500">
          <Calendar size={48} className="mx-auto mb-3 opacity-30 text-indigo-400" />
          <span className="font-semibold text-gray-300">No Published Timetable</span>
          <p className="text-xs text-gray-500 mt-1">There is no published schedule for your class-section right now.</p>
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
