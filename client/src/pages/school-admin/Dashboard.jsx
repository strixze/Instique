import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, DollarSign, ClipboardCheck, TrendingUp, TrendingDown,
  Clock, BookOpen, AlertCircle, ChevronRight, CheckCircle2, UserCheck,
  FileCheck, ShieldAlert, Coffee, ArrowUpRight, ChevronDown, Calendar, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { dashboardApi } from '../../api/dashboard.api';
import { useUserStore } from '../../store/userStore';

// ── Helpers ──

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatINR(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(1)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}k`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

function formatActivityTime(time) {
  if (!time) return 'Just now';
  const date = new Date(time);
  if (isNaN(date.getTime())) return '—';
  
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const activityIconMap = {
  UserCheck,
  DollarSign,
  CheckCircle2,
  FileCheck,
  BookOpen,
  ShieldAlert,
};

export default function SchoolAdminDashboard() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Period Filter States
  const [attendancePeriod, setAttendancePeriod] = useState('This Week');
  const [classAttendancePeriod, setClassAttendancePeriod] = useState('This Week');
  const [feePeriod, setFeePeriod] = useState('This Month');

  // Dropdown Open States
  const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [feeDropdownOpen, setFeeDropdownOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.getSchoolAdmin({
        attendancePeriod: attendancePeriod.toLowerCase().includes('today') ? 'today' : attendancePeriod.toLowerCase().includes('month') ? 'month' : 'week',
        classAttendancePeriod: classAttendancePeriod.toLowerCase().includes('today') ? 'today' : classAttendancePeriod.toLowerCase().includes('month') ? 'month' : 'week',
        feePeriod: feePeriod.toLowerCase().includes('today') ? 'today' : feePeriod.toLowerCase().includes('week') ? 'week' : feePeriod.toLowerCase().includes('session') ? 'session' : 'month',
      });
      setDashboardData(res.data);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [attendancePeriod, classAttendancePeriod, feePeriod]);

  // Extract real metrics or clean defaults
  const summary = dashboardData?.summary || {};
  const needsAttention = dashboardData?.needsAttention || {};
  const attendanceOverview = dashboardData?.attendanceOverview || {};
  const todaysSchedule = dashboardData?.todaysSchedule || [];
  const attendanceByClass = dashboardData?.attendanceByClass || [];
  const feeCollection = dashboardData?.feeCollection || {};
  const recentActivities = dashboardData?.recentActivities || [];

  // Chart datasets from live data
  const attendanceChartData = (attendanceOverview.data && attendanceOverview.data.length > 0)
    ? attendanceOverview.data
    : [];

  const feeDonutData = feeCollection.donutData || [
    { name: 'Collected', value: feeCollection.collected || 0, color: '#6C5CE7' },
    { name: 'Pending', value: feeCollection.pending || 0, color: '#D97706' },
  ];

  const totalNeedsAttentionCount = 
    (needsAttention.lowAttendanceCount > 0 ? 1 : 0) +
    (needsAttention.pendingApplications > 0 ? 1 : 0) +
    (needsAttention.pendingFeesAmount > 0 ? 1 : 0) +
    (needsAttention.pendingLeaves > 0 ? 1 : 0) +
    (needsAttention.timetableConflicts > 0 ? 1 : 0);

  const currentDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-5 w-full pb-10">
      {/* ── Page Greeting & Live Date ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Here's your school overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-secondary bg-white border border-border px-3 py-1.5 rounded-xl shadow-2xs w-fit">
          <Calendar size={13} className="text-forest" />
          <span>{currentDateString}</span>
        </div>
      </div>

      {/* ── Row 1: 4 Contextual Operational KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {/* Total Students */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <Users size={20} strokeWidth={1.8} />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-muted bg-slate-100/80 border border-slate-200/50 uppercase">
              Total Students
            </span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-deep leading-none tracking-tight">
              {loading ? '...' : (summary.studentCount ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              <TrendingUp size={12} /> {summary.studentGrowthPercent ?? 100}%
            </span>
            <span className="text-muted text-[11px] font-medium">
              {summary.newAdmissionsMonth ?? 0} New Admissions
            </span>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <GraduationCap size={20} strokeWidth={1.8} />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-muted bg-slate-100/80 border border-slate-200/50 uppercase">
              Total Teachers
            </span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-deep leading-none tracking-tight">
              {loading ? '...' : (summary.teacherCount ?? 0)}
            </p>
          </div>
          <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              <TrendingUp size={12} /> {summary.teacherGrowthPercent ?? 100}%
            </span>
            <span className="text-muted text-[11px] font-medium">
              {summary.teachersOnLeaveToday ?? 0} On Leave Today
            </span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <ClipboardCheck size={20} strokeWidth={1.8} />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-muted bg-slate-100/80 border border-slate-200/50 uppercase">
              Today's Attendance
            </span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-deep leading-none tracking-tight">
              {loading ? '...' : summary.todayAttendance?.percentage !== null && summary.todayAttendance?.percentage !== undefined ? `${summary.todayAttendance.percentage}%` : '—'}
            </p>
          </div>
          <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs">
            {summary.todayAttendance?.vsYesterday !== null && summary.todayAttendance?.vsYesterday !== undefined ? (
              <span className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full border ${summary.todayAttendance.vsYesterday >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : 'bg-rose-50 text-rose-600 border-rose-200/50'}`}>
                {summary.todayAttendance.vsYesterday >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {summary.todayAttendance.vsYesterday >= 0 ? `+${summary.todayAttendance.vsYesterday}%` : `${summary.todayAttendance.vsYesterday}%`}
              </span>
            ) : (
              <span className="text-[11px] text-muted font-medium">No comparison data</span>
            )}
            <span className="text-muted text-[11px] font-medium">
              {summary.todayAttendance?.absentCount ?? 0} Absent Today
            </span>
          </div>
        </div>

        {/* Fees Collected */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center font-bold text-base shrink-0">
              ₹
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-muted bg-slate-100/80 border border-slate-200/50 uppercase">
              Fees Collected
            </span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-deep leading-none tracking-tight">
              {loading ? '...' : formatINR(summary.feesCollected?.collectedSession)}
            </p>
          </div>
          <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs">
            <span className="text-muted text-[11px] font-medium">
              {summary.feesCollected?.feeCollectionRate ?? 0}% of {formatINR(summary.feesCollected?.targetSession)} target
            </span>
            <span className="text-deep font-bold text-xs">
              {formatINR(summary.feesCollected?.pendingSession)} <span className="text-muted font-normal text-[11px]">Pending</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Middle Operational Command Grid (3 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
        {/* Needs Attention */}
        <div className="bg-white border border-border rounded-2xl shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Needs Attention</h3>
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {totalNeedsAttentionCount}
              </span>
            </div>
          </div>

          <div className="p-3 space-y-1">
            {/* Low Attendance */}
            <div
              onClick={() => navigate('/attendance')}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Users size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {needsAttention.lowAttendanceCount ?? 0} Students
                  </p>
                  <p className="text-[11px] text-muted">Attendance below 75%</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Pending Admissions */}
            <div
              onClick={() => navigate('/admissions')}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <BookOpen size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {needsAttention.pendingApplications ?? 0} Applications
                  </p>
                  <p className="text-[11px] text-muted">Awaiting admission review</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Pending Fees */}
            <div
              onClick={() => navigate('/fees')}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                  ₹
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {formatINR(needsAttention.pendingFeesAmount)}
                  </p>
                  <p className="text-[11px] text-muted">
                    Fees pending from {needsAttention.pendingFeesStudentCount ?? 0} {needsAttention.pendingFeesStudentCount === 1 ? 'student' : 'students'}
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Leave Requests */}
            <div
              onClick={() => navigate('/leaves')}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <GraduationCap size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {needsAttention.pendingLeaves ?? 0} Requests
                  </p>
                  <p className="text-[11px] text-muted">Teacher leave requests pending</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Timetable Conflicts */}
            <div
              onClick={() => navigate('/timetable')}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {needsAttention.timetableConflicts ?? 0} Conflicts
                  </p>
                  <p className="text-[11px] text-muted">Timetable conflicts detected</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>
          </div>
        </div>

        {/* Attendance Overview (Spline Area Chart) */}
        <div className="bg-white border border-border rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Attendance Overview</h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAttendanceDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 text-xs text-secondary bg-slate-50 px-2.5 py-1 rounded-lg cursor-pointer border border-border hover:bg-slate-100 transition-colors"
              >
                <span>{attendancePeriod}</span>
                <ChevronDown size={12} className="text-muted" />
              </button>
              {attendanceDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-border rounded-xl shadow-lg z-30 py-1 text-xs">
                  {['Today', 'This Week', 'This Month'].map((p) => (
                    <button
                      key={p}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${attendancePeriod === p ? 'font-bold text-forest bg-forest/5' : 'text-deep'}`}
                      onClick={() => {
                        setAttendancePeriod(p);
                        setAttendanceDropdownOpen(false);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-5 pt-4">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-3xl font-extrabold text-deep tracking-tight">
                  {attendanceOverview.averagePercentage !== null && attendanceOverview.averagePercentage !== undefined
                    ? `${attendanceOverview.averagePercentage}%`
                    : '—'}
                </span>
                <p className="text-xs text-muted font-medium mt-0.5">Average Attendance</p>
              </div>
              {attendanceOverview.vsPreviousPeriod !== null && attendanceOverview.vsPreviousPeriod !== undefined ? (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${attendanceOverview.vsPreviousPeriod >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : 'bg-rose-50 text-rose-600 border-rose-200/50'}`}>
                  {attendanceOverview.vsPreviousPeriod >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {attendanceOverview.vsPreviousPeriod >= 0 ? `+${attendanceOverview.vsPreviousPeriod}%` : `${attendanceOverview.vsPreviousPeriod}%`}{' '}
                  <span className="font-normal text-muted">vs last period</span>
                </span>
              ) : (
                <span className="text-xs text-muted">No comparison data</span>
              )}
            </div>

            <div className="h-44 w-full">
              {attendanceChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-muted italic">
                  <ClipboardCheck size={24} className="opacity-30 mb-1 text-forest" />
                  No attendance data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.16} />
                        <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} ticks={[0, 25, 50, 75, 100]} />
                    <Tooltip
                      formatter={(val, name, item) => [
                        `${val}% (${item.payload.present ?? 0} present, ${item.payload.absent ?? 0} absent)`,
                        'Attendance'
                      ]}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      stroke="#6C5CE7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#attendanceGradient)"
                      dot={{ fill: '#6C5CE7', stroke: '#FFFFFF', strokeWidth: 2, r: 3.5 }}
                      activeDot={{ r: 5, fill: '#6C5CE7', stroke: '#FFFFFF', strokeWidth: 2 }}
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Today's Schedule Timeline */}
        <div className="bg-white border border-border rounded-2xl shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Today's Schedule</h3>
            <button
              onClick={() => navigate('/timetable')}
              className="text-xs font-semibold text-forest hover:underline cursor-pointer"
            >
              View Full Timetable
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-center overflow-y-auto max-h-72">
            {todaysSchedule.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-forest-soft text-forest flex items-center justify-center mb-3">
                  <Clock size={22} strokeWidth={1.8} />
                </div>
                <h4 className="text-sm font-bold text-deep mb-1">No classes scheduled today.</h4>
                <p className="text-xs text-muted max-w-xs leading-relaxed">
                  Enjoy your Sunday or review tomorrow's academic timetable in advance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysSchedule.map((item, index) => (
                  <div key={index} className={`flex items-start justify-between border-l-2 ${item.color || 'border-l-forest'} pl-3 py-0.5`}>
                    <div>
                      <span className="text-[11px] font-semibold text-muted block">{item.time}</span>
                      <p className="text-xs font-bold text-deep leading-snug mt-0.5">{item.subject}</p>
                      <p className="text-[11px] text-muted">{item.classRoom}</p>
                    </div>
                    {item.isBreak ? (
                      <Coffee size={15} className="text-muted shrink-0 mt-1" />
                    ) : (
                      <span className="text-[11px] font-medium text-secondary text-right shrink-0">
                        {item.teacher}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Bottom Operations Row (3 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
        {/* Attendance by Class */}
        <div className="bg-white border border-border rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Attendance by Class</h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setClassDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 text-xs text-secondary bg-slate-50 px-2.5 py-1 rounded-lg cursor-pointer border border-border hover:bg-slate-100 transition-colors"
              >
                <span>{classAttendancePeriod}</span>
                <ChevronDown size={12} className="text-muted" />
              </button>
              {classDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-border rounded-xl shadow-lg z-30 py-1 text-xs">
                  {['Today', 'This Week', 'This Month'].map((p) => (
                    <button
                      key={p}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${classAttendancePeriod === p ? 'font-bold text-forest bg-forest/5' : 'text-deep'}`}
                      onClick={() => {
                        setClassAttendancePeriod(p);
                        setClassDropdownOpen(false);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="space-y-3.5">
              {attendanceByClass.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted italic">
                  No class attendance records available
                </div>
              ) : (
                attendanceByClass.map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-deep">{row.class}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-deep text-xs">
                          {row.percentage}%
                        </span>
                        <span
                          className={`inline-flex items-center text-[10px] font-bold ${
                            row.up ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {row.change !== '—' && (row.up ? `+${row.change}` : row.change)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-forest h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, row.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Fee Collection Overview (Donut Chart) */}
        <div className="bg-white border border-border rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Fee Collection Overview</h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFeeDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 text-xs text-secondary bg-slate-50 px-2.5 py-1 rounded-lg cursor-pointer border border-border hover:bg-slate-100 transition-colors"
              >
                <span>{feePeriod}</span>
                <ChevronDown size={12} className="text-muted" />
              </button>
              {feeDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-border rounded-xl shadow-lg z-30 py-1 text-xs">
                  {['Today', 'This Week', 'This Month', 'This Session'].map((p) => (
                    <button
                      key={p}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${feePeriod === p ? 'font-bold text-forest bg-forest/5' : 'text-deep'}`}
                      onClick={() => {
                        setFeePeriod(p);
                        setFeeDropdownOpen(false);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-5 flex flex-col items-center justify-center">
            {/* Donut with Center Total */}
            <div className="w-44 h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feeDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={feeDonutData.some(d => d.value > 0) ? 3 : 0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {feeDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-muted font-bold tracking-widest uppercase">TOTAL</span>
                <span className="text-base font-extrabold text-deep leading-tight mt-0.5">{formatINR(feeCollection.target || (feeCollection.collected + feeCollection.pending))}</span>
              </div>
            </div>

            {/* Legend & Stats */}
            <div className="grid grid-cols-2 gap-4 w-full pt-3 mt-1 border-t border-border/70 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-forest shrink-0" />
                <div>
                  <span className="text-[11px] text-muted block">Collected</span>
                  <p className="font-bold text-deep text-xs">
                    {formatINR(feeCollection.collected)} <span className="font-normal text-muted text-[10px]">({feeCollection.collectedPercentage ?? 0}%)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <span className="text-[11px] text-muted block">Pending</span>
                  <p className="font-bold text-deep text-xs">
                    {formatINR(feeCollection.pending)} <span className="font-normal text-muted text-[10px]">({feeCollection.pendingPercentage ?? 0}%)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-border rounded-2xl shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Recent Activity</h3>
            <button
              onClick={() => navigate('/notices')}
              className="text-xs font-semibold text-forest hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="p-5 space-y-3.5 max-h-72 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted italic">
                <FileCheck size={24} className="mx-auto mb-2 opacity-30 text-forest" />
                No recent activity recorded yet.
              </div>
            ) : (
              recentActivities.map((act, index) => {
                const IconComponent = activityIconMap[act.icon] || FileCheck;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl ${act.color || 'bg-slate-100 text-slate-700'} flex items-center justify-center shrink-0`}>
                      <IconComponent size={14} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-deep truncate leading-tight">
                          {act.title}
                        </p>
                        <span className="text-[10px] font-medium text-muted shrink-0">
                          {formatActivityTime(act.time)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {act.desc}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
        <p>© 2026 Instique School Management System. All rights reserved.</p>
        <p className="font-medium">Version 1.0.0</p>
      </footer>
    </div>
  );
}
