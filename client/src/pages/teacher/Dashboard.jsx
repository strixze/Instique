import { BookOpen, ClipboardList, Calendar, Trophy } from 'lucide-react';
import Card from '../../components/ui/Card';

export default function TeacherDashboard() {
 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-deep">Teacher Dashboard</h1>
 <p className="text-muted text-sm mt-1">Your overview</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-forest"><Calendar size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep">-</p><p className="text-sm text-muted">Today's Classes</p></div></div></Card>
 <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-forest"><ClipboardList size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep">-</p><p className="text-sm text-muted">Pending Attendance</p></div></div></Card>
 <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-warning"><BookOpen size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep">-</p><p className="text-sm text-muted">Homework Due</p></div></div></Card>
 <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-info"><Trophy size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep">-</p><p className="text-sm text-muted">Upcoming Exams</p></div></div></Card>
 </div>
 </div>
 );
}
