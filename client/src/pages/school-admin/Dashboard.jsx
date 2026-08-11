import { useEffect, useState } from 'react';
import {
  Users, GraduationCap, DollarSign, CheckCircle, TrendingUp, TrendingDown,
  Clock, BookOpen, Bell as BellIcon, Calendar, ArrowUpRight, MoreHorizontal,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { studentApi } from '../../api/student.api';
import { teacherApi } from '../../api/teacher.api';
import { noticeApi } from '../../api/notice.api';
import { useUserStore } from '../../store/userStore';

/* ── helpers ─────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── KPI Card ────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, trend, trendLabel, color = 'bg-sage-soft' }) {
  const isPositive = trend && trend > 0;
  return (
    <Card className="group hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} className="text-forest" />
        </div>
        <button className="p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-deep rounded transition-all">
          <MoreHorizontal size={16} />
        </button>
      </div>
      <div className="mt-3">
        <p className="text-[28px] font-bold text-deep leading-tight tracking-tight">{value ?? '—'}</p>
        <p className="text-[13px] text-muted mt-0.5">{label}</p>
      </div>
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend !== undefined && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isPositive ? '+' : ''}{trend}%
            </span>
          )}
          {trendLabel && <span className="text-xs text-muted">{trendLabel}</span>}
        </div>
      )}
    </Card>
  );
}

/* ── Schedule Item ───────────────────────────────────────── */
function ScheduleItem({ time, subject, detail, borderColor = 'border-l-forest' }) {
  return (
    <div className={`flex gap-3 border-l-[3px] ${borderColor} pl-3 py-2`}>
      <span className="text-xs text-muted font-medium whitespace-nowrap w-16">{time}</span>
      <div>
        <p className="text-sm font-medium text-deep">{subject}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
    </div>
  );
}

/* ── Custom chart tooltip ────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-dropdown px-3 py-2 text-xs">
      <p className="font-medium text-deep mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted"><span className="font-medium text-deep">{p.value}%</span> {p.name}</p>
      ))}
    </div>
  );
}

/* ── Dashboard ───────────────────────────────────────────── */
export default function SchoolAdminDashboard() {
  const user = useUserStore((s) => s.user);
  const [data, setData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [students, teachers, noticesRes] = await Promise.all([
          studentApi.getAll({ limit: 1 }),
          teacherApi.getAll({ limit: 1 }),
          noticeApi.getAll({ limit: 4 }).catch(() => ({ data: [] })),
        ]);
        setData({
          studentCount: students.meta?.total || 0,
          teacherCount: teachers.meta?.total || 0,
        });
        setNotices(noticesRes.data || []);
      } catch (e) {
        void e;
      }
      setLoading(false);
    };
    fetch();
  }, []);

  /* Static chart data for dashboard display */
  const attendanceData = [
    { day: 'Mon', attendance: 96 },
    { day: 'Tue', attendance: 94 },
    { day: 'Wed', attendance: 93 },
    { day: 'Thu', attendance: 95 },
    { day: 'Fri', attendance: 91 },
  ];

  const feeData = [
    { month: 'Apr', collected: 4.2, pending: 1.1, overdue: 0.3 },
    { month: 'May', collected: 5.1, pending: 0.8, overdue: 0.2 },
    { month: 'Jun', collected: 4.8, pending: 1.3, overdue: 0.4 },
    { month: 'Jul', collected: 6.2, pending: 0.9, overdue: 0.1 },
    { month: 'Aug', collected: 5.6, pending: 1.0, overdue: 0.3 },
  ];

  const studentTotal = data?.studentCount || 0;
  const boysPct = 52;
  const girlsPct = 48;
  const studentDistribution = [
    { name: 'Boys', value: boysPct },
    { name: 'Girls', value: girlsPct },
  ];
  const pieColors = ['#35583F', '#6B8F8A'];

  const scheduleItems = [
    { time: '09:00 AM', subject: 'Mathematics', detail: 'Grade 10A • Room 204', borderColor: 'border-l-forest' },
    { time: '10:30 AM', subject: 'Physics', detail: 'Grade 11B • Lab 2', borderColor: 'border-l-info' },
    { time: '12:00 PM', subject: 'English Literature', detail: 'Grade 9C • Room 108', borderColor: 'border-l-warning' },
    { time: '01:00 PM', subject: 'Lunch Break', detail: '45 minutes', borderColor: 'border-l-sage' },
    { time: '02:00 PM', subject: 'History', detail: 'Grade 8A • Room 301', borderColor: 'border-l-danger' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-card" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 rounded-card lg:col-span-2" />
          <Skeleton className="h-72 rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-deep">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-secondary text-sm mt-1">
          Here's what's happening across your institution today.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Students" value={data?.studentCount?.toLocaleString('en-IN')} trend={4.8} trendLabel="this month" />
        <KpiCard icon={GraduationCap} label="Teachers" value={data?.teacherCount} trend={3.6} trendLabel="this month" />
        <KpiCard icon={CheckCircle} label="Attendance" value="94.2%" trend={2.1} trendLabel="vs last week" />
        <KpiCard icon={DollarSign} label="Fees Collected" value="₹24.8L" trend={-1.2} trendLabel="78% of target" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="p-5 pb-0 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-deep">Attendance Overview</h3>
              <p className="text-xs text-muted mt-0.5">Weekly attendance rate (%)</p>
            </div>
            <Badge color="primary">This Week</Badge>
          </div>
          <div className="px-2 pb-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} barCategoryGap="35%">
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7B877F', fontSize: 12 }} />
                <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: '#7B877F', fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#E8F0EA' }} />
                <Bar dataKey="attendance" name="Attendance" fill="#35583F" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card padding={false}>
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-deep">Today's Schedule</h3>
              <p className="text-xs text-muted mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            <Clock size={16} className="text-muted" />
          </div>
          <div className="px-5 pb-5 space-y-1">
            {scheduleItems.map((item, i) => (
              <ScheduleItem key={i} {...item} />
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Fee Collection */}
        <Card padding={false}>
          <div className="p-5 pb-0">
            <h3 className="text-base font-semibold text-deep">Fee Collection</h3>
            <p className="text-xs text-muted mt-0.5">Monthly overview (₹ in Lakhs)</p>
          </div>
          <div className="px-2 pb-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeData} barCategoryGap="25%">
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7B877F', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7B877F', fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#E8F0EA' }} />
                <Bar dataKey="collected" name="Collected" fill="#35583F" radius={[4, 4, 0, 0]} maxBarSize={20} stackId="a" />
                <Bar dataKey="pending" name="Pending" fill="#C49A32" radius={[0, 0, 0, 0]} maxBarSize={20} stackId="a" />
                <Bar dataKey="overdue" name="Overdue" fill="#C85B55" radius={[4, 4, 0, 0]} maxBarSize={20} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-4 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-forest" /> Collected</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-warning" /> Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-danger" /> Overdue</span>
          </div>
        </Card>

        {/* Student Distribution */}
        <Card padding={false}>
          <div className="p-5 pb-0">
            <h3 className="text-base font-semibold text-deep">Student Distribution</h3>
            <p className="text-xs text-muted mt-0.5">Gender breakdown</p>
          </div>
          <div className="flex items-center justify-center h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {studentDistribution.map((_, index) => (
                    <Cell key={index} fill={pieColors[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-deep">{studentTotal.toLocaleString('en-IN')}</span>
              <span className="text-xs text-muted">Total</span>
            </div>
          </div>
          <div className="px-5 pb-4 flex items-center justify-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-forest" /> Boys {boysPct}%</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-info" /> Girls {girlsPct}%</span>
          </div>
        </Card>

        {/* Notice Board */}
        <Card padding={false}>
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-deep">Notice Board</h3>
              <p className="text-xs text-muted mt-0.5">Recent announcements</p>
            </div>
            <BellIcon size={16} className="text-muted" />
          </div>
          <div className="px-5 pb-5 space-y-3">
            {notices.length > 0 ? notices.map((n, i) => (
              <div key={n._id || i} className="flex items-start gap-3 group cursor-pointer">
                <div className="w-1.5 h-1.5 rounded-full bg-forest mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-deep truncate group-hover:text-forest transition-colors">{n.title}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )) : (
              <>
                <NoticeRow title="Exam Schedule Released" tag="Academic" time="Today" />
                <NoticeRow title="Parent-Teacher Meeting" tag="Event" time="Tomorrow" />
                <NoticeRow title="Independence Day Celebration" tag="Announcement" time="Aug 15" />
                <NoticeRow title="Library Books Due" tag="Library" time="Aug 18" />
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NoticeRow({ title, tag, time }) {
  const tagColors = {
    Academic: 'primary',
    Event: 'info',
    Announcement: 'warning',
    Library: 'success',
  };
  return (
    <div className="flex items-start gap-3 group cursor-pointer">
      <div className="w-1.5 h-1.5 rounded-full bg-forest mt-2 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-deep truncate group-hover:text-forest transition-colors">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge color={tagColors[tag] || 'gray'}>{tag}</Badge>
          <span className="text-xs text-muted">{time}</span>
        </div>
      </div>
    </div>
  );
}
