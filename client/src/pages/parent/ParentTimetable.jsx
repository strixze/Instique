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
 className="w-48 bg-white border-border"
 options={children.map((c) => ({ value: c._id, label: `${c.firstName} ${c.lastName}` }))}
 value={selectedChildId}
 onChange={(e) => setSelectedChildId(e.target.value)}
 />
 )}
 {timetable && (
 <Button variant="outline"onClick={handlePrint}>
 <Printer size={16} className="mr-2"/> Print Timetable
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
 <div className="h-60 flex items-center justify-center text-muted">
 Loading child's timetable...
 </div>
 ) : children.length === 0 ? (
 <div className="bg-white/80 border border-border rounded-xl p-12 text-center text-muted">
 <Users size={48} className="mx-auto mb-3 opacity-30 text-forest"/>
 <span className="font-semibold text-secondary">No Linked Students</span>
 <p className="text-xs text-muted mt-1">There are no children linked to your parent profile currently.</p>
 </div>
 ) : !timetable ? (
 <div className="bg-white/80 border border-border rounded-xl p-12 text-center text-muted">
 <Calendar size={48} className="mx-auto mb-3 opacity-30 text-forest"/>
 <span className="font-semibold text-secondary">No Published Timetable</span>
 <p className="text-xs text-muted mt-1">There is no published schedule for {selectedChild?.firstName}'s class-section right now.</p>
 </div>
 ) : (
 <div className="bg-white border border-border rounded-2xl p-5 shadow-2xl overflow-x-auto print:border-none print:shadow-none print:p-0">
 <table className="w-full text-sm border-collapse min-w-[700px]">
 <thead>
 <tr className="border-b border-border/60 print:border-border">
 <th className="px-3 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider w-24 print:text-secondary">
 Period
 </th>
 {workingDays.map((d) => (
 <th key={d} className="px-3 py-3 text-center text-xs font-bold text-muted uppercase tracking-wider print:text-secondary">
 {DAYS.find((day) => day.value === d)?.label || 'Day'}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50 print:divide-gray-200">
 {Array.from({ length: maxPeriods }).map((_, idx) => {
 const pNo = idx + 1;
 return (
 <tr key={idx} className="hover:bg-white/10">
 <td className="px-3 py-4 font-bold text-muted border-r border-border/40 print:border-gray-200 print:text-secondary">
 <div>P{pNo}</div>
 {timetable.periods?.find((p) => p.periodNo === pNo) && (
 <div className="text-[10px] text-muted font-normal mt-0.5 print:text-muted">
 {timetable.periods.find((p) => p.periodNo === pNo).startTime || '—'} -{' '}
 {timetable.periods.find((p) => p.periodNo === pNo).endTime || '—'}
 </div>
 )}
 </td>
 {workingDays.map((d) => {
 const p = timetable.periods?.find((item) => item.day === d && item.periodNo === pNo);

 if (!p) {
 return (
 <td key={d} className="px-2 py-3 border border-border/35 print:border-gray-200 text-center text-muted italic">
 —
 </td>
 );
 }

 if (p.isLunch || p.isBreak || p.isAssembly || p.isFixed) {
 return (
 <td
 key={d}
 className="px-2 py-3 border border-border/30 bg-white/40 text-center font-semibold text-muted select-none text-xs print:bg-sage-soft/50"
 >
 {p.label || 'Break'}
 </td>
 );
 }

 return (
 <td key={d} className="px-2 py-3 border border-border/35 print:border-gray-200">
 <div className="bg-white/30 border border-border/40 rounded-xl p-2.5 space-y-1 text-center print:bg-sage-soft print:border-border print:text-deep">
 <div className="font-bold text-xs text-forest print:text-indigo-800 flex items-center justify-center gap-1">
 <BookOpen size={11} className="opacity-70"/>
 {p.subject?.name || 'Subject'}
 </div>
 <div className="text-[10px] text-secondary print:text-muted font-medium flex items-center justify-center gap-1">
 <User size={10} className="opacity-70"/>
 {p.teacher ? `${p.teacher.firstName} ${p.teacher.lastName}` : '—'}
 </div>
 {p.room && (
 <div className="text-[9px] text-muted print:text-muted font-semibold">
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
