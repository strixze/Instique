import { Building2, CreditCard, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { schoolApi } from '../../api/school.api';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-100">{value ?? '-'}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await schoolApi.getAll({ limit: 1 });
        setStats({ totalSchools: res.meta?.total || 0, totalRevenue: 0, activeSubscriptions: 0, trialSchools: 0 });
      } catch {}
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
        <h1 className="text-2xl font-bold text-gray-100">Super Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Schools" value={stats?.totalSchools} color="bg-indigo-600" />
        <StatCard icon={CreditCard} label="Active Subscriptions" value={stats?.activeSubscriptions} color="bg-green-600" />
        <StatCard icon={Users} label="Trial Schools" value={stats?.trialSchools} color="bg-yellow-600" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${stats?.totalRevenue}`} color="bg-blue-600" />
      </div>
    </div>
  );
}
