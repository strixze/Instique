import { useEffect, useState } from 'react';
import { Users, GraduationCap, DollarSign, Bell, Calendar, ClipboardList } from 'lucide-react';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { studentApi } from '../../api/student.api';
import { teacherApi } from '../../api/teacher.api';

function StatCard(props) {
  const Icon = props.icon;
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${props.color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-100">{props.value ?? '-'}</p>
          <p className="text-sm text-gray-400">{props.label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SchoolAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [students, teachers] = await Promise.all([
          studentApi.getAll({ limit: 1 }),
          teacherApi.getAll({ limit: 1 }),
        ]);
        setData({
          studentCount: students.meta?.total || 0,
          teacherCount: teachers.meta?.total || 0,
        });
      } catch (e) {
        void e;
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">School Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Students" value={data?.studentCount} color="bg-indigo-600" />
        <StatCard icon={GraduationCap} label="Teachers" value={data?.teacherCount} color="bg-green-600" />
        <StatCard icon={DollarSign} label="Pending Fees" value="-" color="bg-yellow-600" />
        <StatCard icon={Bell} label="Notices" value="-" color="bg-blue-600" />
      </div>
    </div>
  );
}
