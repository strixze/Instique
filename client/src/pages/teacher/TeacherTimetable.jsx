import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Printer } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useUserStore } from '../../store/userStore';
import { timetableApi } from '../../api/timetable.api';

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

 // Build matrix (periods x days)
 // Teacher day counts or periods might span differently. We will dynamically find max periods in the retrieved list.
 const maxPeriods = schedule.length > 0 ? Math.max(...schedule.map((s) => s.periodNo)) : 8;

 return (
 <div className="space-y-5 w-full pb-12 print:p-0">
 <div className="print:hidden">
 <PageHeader
 title="My Timetable Schedule"
 description="View your weekly lectures, classes, sections, and locations."
 action={
 <Button variant="outline"onClick={handlePrint}>
 <Printer size={16} className="mr-2"/> Print Schedule
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
 <div className="h-60 flex items-center justify-center text-muted">
 Loading your schedule...
 </div>
 ) : schedule.length === 0 ? (
 <div className="bg-white/80 border border-border rounded-xl p-12 text-center text-muted">
 <Calendar size={48} className="mx-auto mb-3 opacity-30 text-forest"/>
 <span className="font-semibold text-secondary">No Assignments Yet</span>
 <p className="text-xs text-muted mt-1">You are not assigned to any timetable periods currently.</p>
 </div>
 ) : (
 <div className="bg-white border border-border rounded-2xl p-5 shadow-2xl overflow-x-auto print:border-none print:shadow-none print:p-0">
 <table className="w-full text-sm border-collapse min-w-[700px]">
 <thead>
 <tr className="border-b border-border/60 print:border-border">
 <th className="px-3 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider w-24 print:text-secondary">
 Period
 </th>
 {DAYS.map((d) => (
 <th key={d.value} className="px-3 py-3 text-center text-xs font-bold text-muted uppercase tracking-wider print:text-secondary">
 {d.label}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50 print:divide-gray-200">
 {Array.from({ length: Math.max(8, maxPeriods) }).map((_, idx) => {
 const pNo = idx + 1;
 return (
 <tr key={idx} className="hover:bg-white/10">
 <td className="px-3 py-4 font-bold text-muted border-r border-border/40 print:border-gray-200 print:text-secondary">
 <div>P{pNo}</div>
 {schedule.find((s) => s.periodNo === pNo) && (
 <div className="text-[10px] text-muted font-normal mt-0.5 print:text-muted">
 {schedule.find((s) => s.periodNo === pNo).startTime || '—'} -{' '}
 {schedule.find((s) => s.periodNo === pNo).endTime || '—'}
 </div>
 )}
 </td>
 {DAYS.map((d) => {
 const lectures = schedule.filter((s) => s.day === d.value && s.periodNo === pNo);
 
 return (
 <td key={d.value} className="px-2 py-3 border border-border/35 print:border-gray-200">
 {lectures.length > 0 ? (
 <div className="space-y-2">
 {lectures.map((lec, lIdx) => (
 <div
 key={lIdx}
 className="bg-sage border /40 rounded-xl p-2.5 space-y-1 print:bg-sage-soft print:border-border print:text-deep"
 >
 <div className="font-bold text-xs text-forest print:text-indigo-800">
 {lec.subject?.name || 'Subject'}
 </div>
 <div className="flex items-center gap-1.5 text-[10px] text-secondary print:text-muted font-medium">
 <Clock size={10} className="opacity-70"/>
 Class: {lec.schoolClass?.name} - {lec.section?.name}
 </div>
 {lec.room && (
 <div className="flex items-center gap-1.5 text-[9px] text-muted print:text-muted font-semibold">
 <MapPin size={9} className="opacity-70"/>
 Room: {lec.room}
 </div>
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="text-muted italic text-[11px] text-center select-none print:text-secondary">
 — Empty —
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
 </div>
 )}
 </div>
 );
}
