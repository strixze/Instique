import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, CreditCard, Users, DollarSign, ArrowRight, Plus, Trash2, Save,
  RefreshCw, ShieldCheck, Activity, TrendingUp, Calendar, School, Clock,
  CheckCircle, AlertCircle, ArrowUpRight, FileText,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { dashboardApi } from '../../api/dashboard.api';
import { saasApi } from '../../api/saas.api';

// ── Helpers ──

const PLAN_COLORS = {
  free_trial: '#64748B',
  basic: '#2563EB',
  professional: '#6C5CE7',
  enterprise: '#7C3AED',
};

const PLAN_LABELS = {
  free_trial: 'Free Trial',
  basic: 'Basic Plan',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Installments state
  const [instName, setInstName] = useState('Admission Installment Plan');
  const [percentages, setPercentages] = useState([100]);
  const [loadingInst, setLoadingInst] = useState(true);
  const [savingInst, setSavingInst] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardApi.getSuperAdmin();
      setData(res.data);
    } catch (e) {
      toast.error('Failed to load super admin analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchInstallments = async () => {
    try {
      const res = await saasApi.getInstallments();
      if (res.data) {
        setInstName(res.data.name || 'Admission Installment Plan');
        setPercentages(res.data.percentages || [100]);
      }
    } catch {
      // fallback to initial
    } finally {
      setLoadingInst(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchInstallments();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Installment Config handlers
  const handleAddInstallment = () => {
    setPercentages([...percentages, 0]);
  };

  const handleRemoveInstallment = (index) => {
    if (percentages.length <= 1) return;
    setPercentages(percentages.filter((_, i) => i !== index));
  };

  const handlePercentageChange = (index, value) => {
    const next = [...percentages];
    next[index] = Number(value) || 0;
    setPercentages(next);
  };

  const totalSum = percentages.reduce((sum, val) => sum + val, 0);
  const isValidSum = Math.round(totalSum) === 100;

  const handleSaveInstallments = async () => {
    if (!instName.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (!isValidSum) {
      toast.error('Percentages must sum up to exactly 100%');
      return;
    }
    setSavingInst(true);
    try {
      const res = await saasApi.createInstallments({
        name: instName,
        percentages,
      });
      setPercentages(res.data.percentages);
      toast.success('Installment settings saved successfully');
    } catch (e) {
      toast.error(e?.message || 'Failed to save installment settings');
    } finally {
      setSavingInst(false);
    }
  };

  if (loading || loadingInst) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalSchools: 0,
    activeSchools: 0,
    inactiveSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalUsers: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    expiredSubscriptions: 0,
    totalRevenue: 0,
  };

  const planData = data?.planDistribution || [];
  const recentSchools = data?.recentSchools || [];
  const recentAuditLogs = data?.recentAuditLogs || [];
  const monthlyRevenue = data?.monthlyRevenue || [];

  return (
    <div className="space-y-6 pb-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">Super Admin Command Center</h1>
          <p className="text-secondary text-xs sm:text-sm mt-0.5">
            Real-time platform metrics, multi-tenant school operations, and revenue analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} loading={refreshing} disabled={refreshing}>
            <RefreshCw size={14} className="mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/schools')}>
            <Plus size={14} className="mr-1.5" /> Manage Schools
          </Button>
        </div>
      </div>

      {/* ── Top 4 Operational KPI Cards (Real Data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Schools */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary">Total Schools</p>
              <p className="text-2xl font-bold text-deep leading-tight mt-0.5">
                {stats.totalSchools}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="font-semibold text-success text-xs">
              {stats.activeSchools} Active
            </span>
            <span className="text-muted text-[11px]">
              {stats.inactiveSchools} Inactive / Suspended
            </span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary">Active Subscriptions</p>
              <p className="text-2xl font-bold text-deep leading-tight mt-0.5">
                {stats.activeSubscriptions}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="font-semibold text-warning text-xs">
              {stats.trialSubscriptions} on Trial
            </span>
            <span className="text-muted text-[11px]">
              {stats.expiredSubscriptions} Expired
            </span>
          </div>
        </div>

        {/* Platform Students & Users */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary">Total Enrolled Students</p>
              <p className="text-2xl font-bold text-deep leading-tight mt-0.5">
                {stats.totalStudents.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="font-semibold text-deep text-xs">
              {stats.totalTeachers} Teachers
            </span>
            <span className="text-muted text-[11px]">
              {stats.totalUsers} Total Accounts
            </span>
          </div>
        </div>

        {/* Total Platform Revenue */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center font-bold text-base shrink-0">
              ₹
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary">Platform Revenue</p>
              <p className="text-2xl font-bold text-deep leading-tight mt-0.5">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="font-semibold text-success text-xs">
              Live Aggregate
            </span>
            <span className="text-muted text-[11px]">
              All Fee Collections
            </span>
          </div>
        </div>
      </div>

      {/* ── Middle Row: Plan Distribution & Revenue Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Subscription Plan Distribution (Donut Chart) */}
        <Card padding={false} className="flex flex-col justify-between">
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Subscription Plans</h3>
            <span className="text-xs text-muted font-medium">
              {stats.totalSubscriptions} Total Subscriptions
            </span>
          </div>

          <div className="p-4">
            {planData.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                No subscription plans active yet.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-36 h-36 relative flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={3}
                        dataKey="count"
                        strokeWidth={0}
                      >
                        {planData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.plan] || '#64748B'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-bold text-deep">{stats.activeSubscriptions}</span>
                    <span className="text-[10px] text-muted font-medium">Active</span>
                  </div>
                </div>

                <div className="space-y-2 flex-1 w-full">
                  {planData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PLAN_COLORS[item.plan] || '#64748B' }}
                        />
                        <span className="text-secondary font-medium">{PLAN_LABELS[item.plan] || item.plan}</span>
                      </div>
                      <span className="font-bold text-deep">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Revenue Trends (Real Aggregation) */}
        <Card padding={false} className="lg:col-span-2 flex flex-col justify-between">
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Revenue Activity</h3>
            <span className="text-xs text-muted font-medium">
              Verified Transactions
            </span>
          </div>

          <div className="p-4 pt-2">
            {monthlyRevenue.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted">
                No fee collection transactions recorded in current period.
              </div>
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    />
                    <Bar dataKey="revenue" fill="#6C5CE7" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Bottom Row: Recent Schools & Real Audit Logs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recently Registered Schools (Real Data) */}
        <Card padding={false}>
          <div className="p-4 pb-3 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Registered Schools</h3>
            <button
              onClick={() => navigate('/schools')}
              className="text-xs font-semibold text-forest hover:underline"
            >
              View All ({stats.totalSchools})
            </button>
          </div>

          <div className="p-0 overflow-x-auto">
            {recentSchools.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No schools created yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface/70 border-b border-border text-muted">
                    <th className="px-3.5 py-2 font-semibold uppercase">School</th>
                    <th className="px-3 py-2 font-semibold uppercase">Code</th>
                    <th className="px-3 py-2 font-semibold uppercase">Plan</th>
                    <th className="px-3 py-2 font-semibold uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentSchools.map((s) => (
                    <tr key={s._id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <p className="font-semibold text-deep truncate max-w-[160px]">{s.name}</p>
                        <p className="text-[10px] text-muted">{s.address?.city || s.contact?.email || '—'}</p>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-secondary font-medium">
                        {s.code}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge color="primary">
                          {s.subscription?.plan?.replace('_', ' ') || 'trial'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Badge color={s.status === 'active' ? 'success' : 'gray'}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Real System Audit Logs (Real Data) */}
        <Card padding={false}>
          <div className="p-4 pb-3 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">System Audit Stream</h3>
            <button
              onClick={() => navigate('/audit-logs')}
              className="text-xs font-semibold text-forest hover:underline"
            >
              View Full Logs
            </button>
          </div>

          <div className="p-3 space-y-2">
            {recentAuditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No recent audit log entries recorded.
              </div>
            ) : (
              recentAuditLogs.map((log, idx) => (
                <div key={log._id || idx} className="flex items-start justify-between p-2 rounded-lg hover:bg-surface transition-colors text-xs">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted shrink-0 mt-0.5">
                      <Activity size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-deep truncate">
                        {log.actor?.name || 'System User'}{' '}
                        <span className="font-normal text-muted">({log.actor?.role || 'user'})</span>
                      </p>
                      <p className="text-[11px] text-secondary truncate">
                        <span className="font-medium text-forest">{log.action}</span> on <span className="font-medium">{log.entity}</span>
                        {log.schoolId?.name && ` · ${log.schoolId.name}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted shrink-0 pl-2 pt-0.5">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Custom Installments Settings Card (Preserved Business Functionality) ── */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4 mb-5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-deep">Admission Fee Installment Structure</h2>
            <p className="text-xs text-secondary mt-0.5">
              Configure universal percentage breakdowns for student fee installments. Students must complete the first installment to confirm admission.
            </p>
          </div>
          <Button onClick={handleSaveInstallments} loading={savingInst} disabled={!isValidSum || !instName.trim()} size="sm">
            <Save size={14} className="mr-1.5" /> Save Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <Input
              label="Installment Plan Name *"
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
              placeholder="e.g. Standard 3-Part Installment Plan"
            />

            <div className="space-y-2">
              <label className="text-xs font-semibold text-secondary block">Installment Percentages *</label>

              <div className="space-y-2">
                {percentages.map((percent, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={percent === 0 ? '' : percent}
                        onChange={(e) => handlePercentageChange(idx, e.target.value)}
                        placeholder={`Installment ${idx + 1} percentage`}
                      />
                      <span className="absolute right-3 top-[7px] text-xs text-muted">%</span>
                    </div>
                    {percentages.length > 1 && (
                      <button
                        onClick={() => handleRemoveInstallment(idx)}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                        title="Remove installment"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={handleAddInstallment} className="mt-1">
                <Plus size={13} className="mr-1" /> Add Installment
              </Button>
            </div>
          </div>

          {/* Visual Validation Preview */}
          <div className="p-4 bg-surface border border-border rounded-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-deep text-xs uppercase tracking-wider">Installment Breakdown</h3>

              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white border border-border rounded-lg justify-center min-h-[56px]">
                {percentages.map((percent, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold text-center border transition-all ${isValidSum ? 'bg-success-light text-success-text border-success/20' : 'bg-surface text-secondary border-border'}`}>
                      Inst. {idx + 1}
                      <div className="text-xs font-bold mt-0.5">{percent}%</div>
                    </div>
                    {idx < percentages.length - 1 && (
                      <ArrowRight size={12} className="text-muted" />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Total Sum:</span>
                  <span className={isValidSum ? 'text-success-text font-bold' : 'text-danger-text font-bold'}>{totalSum}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Required for Admission:</span>
                  <span className="text-forest font-bold">{percentages[0] || 0}% (1st Installment)</span>
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-lg text-[11px] border ${isValidSum ? 'bg-success-light text-success-text border-success/20' : 'bg-danger-light text-danger-text border-danger/20'}`}>
              {isValidSum ? (
                <p className="font-medium">✓ Percentages sum to 100%. Valid configuration.</p>
              ) : (
                <p className="font-medium">⚠ Total sum is {totalSum}%. Percentages must equal exactly 100%.</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
