import { ClipboardList, BookOpen, DollarSign, Trophy } from 'lucide-react';
import Card from '../../components/ui/Card';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Student Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-indigo-600"><ClipboardList size={24} className="text-white" /></div><div><p className="text-2xl font-bold text-gray-100">-</p><p className="text-sm text-gray-400">Attendance</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-green-600"><BookOpen size={24} className="text-white" /></div><div><p className="text-2xl font-bold text-gray-100">-</p><p className="text-sm text-gray-400">Homework</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-yellow-600"><DollarSign size={24} className="text-white" /></div><div><p className="text-2xl font-bold text-gray-100">-</p><p className="text-sm text-gray-400">Fee Status</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-600"><Trophy size={24} className="text-white" /></div><div><p className="text-2xl font-bold text-gray-100">-</p><p className="text-sm text-gray-400">Recognition</p></div></div></Card>
      </div>
    </div>
  );
}
