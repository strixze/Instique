import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, BookOpen, DollarSign, Trophy,
  Calendar, Bell, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { dashboardApi } from '../../api/dashboard.api';
import { useUserStore } from '../../store/userStore';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatINR(amount) {
  if (!amount || amount === 0) return '₹0';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

const STATUS_COLORS = {
  present: 'bg-success',
  absent: 'bg-danger',
  late: 'bg-warning',
  leave: 'bg-info',
  holiday: 'bg-surface border border-border',
  unknown: 'bg-surface border border-border',
};

export default function StudentDashboard() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    dashboardApi.getStudent()
      .then((res) => { if (active) setData(res.data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const attendance = data?.attendance || { present: 0, total: 0, percentage: null, recentDays: [] };
  const homework = data?.homework || [];
  const fees = data?.fees || { total: 0, paid: 0, pending: 0, overdue: 0 };
  const results = data?.results || [];
  const notices = data?.notices || [];
  const recognition = data?.recognition || 0;
  const events = data?.events || [];

  const attPercent = attendance.percentage !== null ? `${attendance.percentage}%` : '—';
  const attBg = attendance.percentage >= 75 ? 'bg-forest' : attendance.percentage !== null ? 'bg-danger' : 'bg-surface';

  const kpis = [
    {
      icon: ClipboardList,
      iconBg: attendance.percentage !== null && attendance.percentage < 75 ? 'bg-danger' : 'bg-forest',
      value: attPercent,
      label: 'Attendance (30 Days)',
      sub: `${attendance.present} / ${attendance.total} days`,
      subColor: attendance.percentage !== null && attendance.percentage < 75 ? 'text-danger' : 'text-muted',
      onClick: () => navigate('/attendance'),
    },
    {
      icon: BookOpen,
      iconBg: homework.length > 0 ? 'bg-warning' : 'bg-forest',
      value: homework.length,
      label: 'Homework Tasks',
      sub: 'Recent assignments',
      subColor: 'text-muted',
      onClick: () => navigate('/homework'),
    },
    {
      icon: DollarSign,
      iconBg: fees.overdue > 0 ? 'bg-danger' : fees.pending > 0 ? 'bg-warning' : 'bg-forest',
      value: formatINR(fees.pending),
      label: 'Fee Pending',
      sub: fees.overdue > 0 ? `${fees.overdue} overdue` : 'All up to date',
      subColor: fees.overdue > 0 ? 'text-danger' : 'text-muted',
      onClick: () => navigate('/fees'),
    },
    {
      icon: Trophy,
      iconBg: 'bg-info',
      value: recognition,
      label: 'Recognition Points',
      sub: 'Total points earned',
      subColor: 'text-muted',
      onClick: () => {},
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">Here's your academic overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div
            key={i}
            onClick={k.onClick}
            className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${k.iconBg} shrink-0`}>
                <k.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-deep group-hover:text-forest transition-colors">{k.value}</p>
                <p className="text-xs text-muted">{k.label}</p>
              </div>
            </div>
            <p className={`text-[11px] mt-2 ${k.subColor}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Attendance Heatmap */}
        <Card padding={false}>
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Attendance History</h3>
            <button onClick={() => navigate('/attendance')} className="text-xs font-semibold text-forest hover:underline">
              View All
            </button>
          </div>
          <div className="p-4">
            {attendance.recentDays.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No attendance records in the last 30 days.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {attendance.recentDays.map((d, i) => (
                    <div
                      key={i}
                      title={`${new Date(d.date).toLocaleDateString('en-IN')} — ${d.status}`}
                      className={`w-6 h-6 rounded-md ${STATUS_COLORS[d.status] || STATUS_COLORS.unknown} cursor-default`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted pt-1">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success inline-block" /> Present</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-danger inline-block" /> Absent</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning inline-block" /> Late</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-info inline-block" /> Leave</span>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted">Overall Attendance</span>
                  <span className={`text-xs font-bold ${attendance.percentage !== null && attendance.percentage < 75 ? 'text-danger' : 'text-forest'}`}>
                    {attPercent}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Homework */}
        <Card padding={false}>
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Recent Homework</h3>
            <button onClick={() => navigate('/homework')} className="text-xs font-semibold text-forest hover:underline">
              View All
            </button>
          </div>
          <div className="p-4 space-y-2">
            {homework.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No recent homework assigned.</p>
            ) : (
              homework.map((hw) => (
                <div key={hw.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={14} className="text-secondary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-deep">{hw.title}</p>
                      <p className="text-[11px] text-muted">
                        Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </p>
                    </div>
                  </div>
                  <Badge color={hw.submittedAt ? 'success' : 'warning'}>
                    {hw.submittedAt ? 'Submitted' : 'Due'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Notices & Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Notices */}
        <Card padding={false}>
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">School Notices</h3>
            <button onClick={() => navigate('/notices')} className="text-xs font-semibold text-forest hover:underline">
              View All
            </button>
          </div>
          <div className="p-4 space-y-2">
            {notices.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No published notices yet.</p>
            ) : (
              notices.map((n) => (
                <div key={n._id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface transition-colors">
                  <Bell size={13} className="text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-deep">{n.title}</p>
                    <p className="text-[11px] text-muted">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Exams & Events */}
        <Card padding={false}>
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Upcoming Exams</h3>
            <button onClick={() => navigate('/exams')} className="text-xs font-semibold text-forest hover:underline">
              View All
            </button>
          </div>
          <div className="p-4 space-y-2">
            {results.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No upcoming exams scheduled.</p>
            ) : (
              results.map((exam) => (
                <div key={exam._id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={14} className="text-secondary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-deep">{exam.name}</p>
                      <p className="text-[11px] text-muted">
                        {exam.startDate ? new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        {exam.endDate && exam.endDate !== exam.startDate
                          ? ` – ${new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <Badge color={exam.status === 'upcoming' ? 'primary' : 'success'}>{exam.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Fee Summary (if there's data) */}
      {fees.total > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Fee Summary</h3>
            <button onClick={() => navigate('/fees')} className="text-xs font-semibold text-forest hover:underline">
              View Details
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-forest">{formatINR(fees.paid)}</p>
              <p className="text-xs text-muted">Paid</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${fees.pending > 0 ? 'text-warning' : 'text-deep'}`}>
                {formatINR(fees.pending)}
              </p>
              <p className="text-xs text-muted">Pending</p>
            </div>
            <div>
              <p className="text-lg font-bold text-deep">{formatINR(fees.total)}</p>
              <p className="text-xs text-muted">Total Billed</p>
            </div>
          </div>
          {fees.total > 0 && (
            <div className="mt-3">
              <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                <div
                  className="bg-forest h-full rounded-full transition-all"
                  style={{ width: `${Math.min(Math.round((fees.paid / fees.total) * 100), 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted mt-1 text-right">
                {Math.round((fees.paid / fees.total) * 100)}% collected
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
