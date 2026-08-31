import { ClipboardList, BookOpen, DollarSign, Trophy } from 'lucide-react';
import Card from '../../components/ui/Card';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-deep dark:text-dark-text">Student Dashboard</h1>
          <p className="text-muted dark:text-dark-text-muted text-sm mt-1">Your academic overview & daily schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-forest dark:bg-emerald-500"><ClipboardList size={24} className="text-white dark:text-gray-900"/></div><div><p className="text-2xl font-bold text-deep dark:text-dark-text">-</p><p className="text-sm text-muted dark:text-dark-text-muted">Attendance</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-forest dark:bg-emerald-500"><BookOpen size={24} className="text-white dark:text-gray-900"/></div><div><p className="text-2xl font-bold text-deep dark:text-dark-text">-</p><p className="text-sm text-muted dark:text-dark-text-muted">Homework</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-warning"><DollarSign size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep dark:text-dark-text">-</p><p className="text-sm text-muted dark:text-dark-text-muted">Fee Status</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-info"><Trophy size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep dark:text-dark-text">-</p><p className="text-sm text-muted dark:text-dark-text-muted">Recognition</p></div></div></Card>
      </div>
    </div>
  );
}
