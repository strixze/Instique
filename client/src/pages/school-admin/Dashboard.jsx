import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, DollarSign, ClipboardCheck, TrendingUp, TrendingDown,
  Clock, BookOpen, AlertCircle, ChevronRight, CheckCircle2, UserCheck,
  FileCheck, ShieldAlert, Coffee, ChevronDown, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { dashboardApi } from '../../api/dashboard.api';
import { useUserStore } from '../../store/userStore';

// ── Helpers ──

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Format a number as Indian lakhs/crores short string */
function formatINR(amount) {
  if (!amount || amount === 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

/** Convert "HH:MM" 24h to "HH:MM AM/PM" */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

const PERIOD_COLORS = [
  'border-l-forest',
  'border-l-info',
  'border-l-warning',
  'border-l-border',
  'border-l-danger',
];

export default function SchoolAdminDashboard() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [attendancePeriod, setAttendancePeriod] = useState('This Week');
  const [classAttendancePeriod, setClassAttendancePeriod] = useState('This Week');

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await dashboardApi.getSchoolAdmin();
        if (active) setData(res.data);
      } catch (e) {
        // error handled gracefully – show empty states
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Derived values from real API data ──

  const studentCount = data?.studentCount || 0;
  const teacherCount = data?.teacherCount || 0;
  const newAdmissionsThisMonth = data?.newAdmissionsThisMonth || 0;
  const teachersOnLeave = data?.teachersOnLeave || 0;

  const todayAtt = data?.todayAttendance || { present: 0, absent: 0, total: 0, percentage: null, hasData: false };
  const attPercent = todayAtt.percentage !== null ? `${todayAtt.percentage}%` : 'N/A';
  const attAbsent = todayAtt.absent || 0;

  const feeStats = data?.feeStats || { totalBilled: 0, totalPaid: 0, totalPending: 0, pendingStudents: 0, collectionPercent: 0 };

  const admissionApplications = data?.admissionApplications || 0;
  const pendingLeaves = data?.pendingLeaves || 0;
  const lowAttendanceCount = data?.lowAttendanceCount || 0;
  const timetableConflicts = data?.timetableConflicts || 0;

  const needsAttentionTotal = [
    lowAttendanceCount > 0,
    admissionApplications > 0,
    feeStats.pendingStudents > 0,
    pendingLeaves > 0,
    timetableConflicts > 0,
  ].filter(Boolean).length;

  // ── Attendance overview trend based on selected period ──
  const selectedTrend =
    attendancePeriod === 'Today'
      ? data?.attendanceOverview?.today || []
      : attendancePeriod === 'This Month'
      ? data?.attendanceOverview?.month || []
      : data?.attendanceOverview?.week || data?.weeklyAttendanceTrend || [];

  const chartData = selectedTrend.map((d) => ({
    day: d.day,
    attendance: d.attendance !== null && d.attendance !== undefined ? d.attendance : (attendancePeriod === 'Today' ? 0 : undefined),
    hasData: d.hasData,
  }));

  const validDays = selectedTrend.filter((d) => d.attendance !== null && d.attendance !== undefined);
  const currentAvg =
    attendancePeriod === 'Today'
      ? (todayAtt.percentage !== null ? todayAtt.percentage : (validDays.length > 0 ? Math.round((validDays.reduce((s, d) => s + (d.attendance || 0), 0) / validDays.length) * 10) / 10 : null))
      : (validDays.length > 0 ? Math.round((validDays.reduce((s, d) => s + (d.attendance || 0), 0) / validDays.length) * 10) / 10 : null);

  // ── Fee donut data ──
  const feeDonutData = [
    { name: 'Collected', value: feeStats.totalPaid || 0, color: '#2D6A4F' },
    { name: 'Pending', value: feeStats.totalPending || 0, color: '#D97706' },
  ];
  const hasAnyFees = feeStats.totalBilled > 0;

  // ── Class attendance table based on selected period ──
  const currentClassAttendance =
    classAttendancePeriod === 'Today'
      ? data?.classAttendanceOverview?.today || []
      : classAttendancePeriod === 'This Month'
      ? data?.classAttendanceOverview?.month || []
      : data?.classAttendanceOverview?.week || data?.classAttendance || [];

  // ── Today's schedule ──
  const todaySchedule = data?.todaySchedule || [];

  // ── Recent activity from audit logs ──
  const recentActivity = data?.recentActivity || [];

  // ── Activity icon/color mapper ──
  function getActivityStyle(action, entity) {
    const a = (action || '').toLowerCase();
    const e = (entity || '').toLowerCase();
    if (a.includes('create') || a.includes('approve') || e.includes('admission')) {
      return { Icon: UserCheck, color: 'bg-forest-soft text-forest' };
    }
    if (e.includes('fee') || e.includes('transaction')) {
      return { Icon: DollarSign, color: 'bg-info-light text-info-text' };
    }
    if (e.includes('leave')) {
      return { Icon: CheckCircle2, color: 'bg-surface text-secondary' };
    }
    if (e.includes('exam') || e.includes('mark') || e.includes('result')) {
      return { Icon: FileCheck, color: 'bg-sage text-forest' };
    }
    if (e.includes('homework') || e.includes('assignment')) {
      return { Icon: BookOpen, color: 'bg-indigo-50 text-indigo-700' };
    }
    return { Icon: Activity, color: 'bg-surface text-muted' };
  }

  return (
    <div className="space-y-6 pb-6">
      {/* ── Page Greeting ── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">
          Here's your school overview for today.
        </p>
      </div>

      {/* ── Row 1: 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary">Total Students</p>
              <p className="text-2xl font-bold text-deep leading-tight mt-0.5">
                {studentCount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-success text-[11px]">
              <TrendingUp size={13} />
              <span className="font-normal text-muted">This month</span>
            </span>
            <div className="text-right">
              <span className="font-bold text-deep text-xs">{newAdmissionsThisMonth}</span>{' '}
              <span className="text-muted text-[11px]">New Admissions</span>
            </div>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary">Total Teachers</p>
              <p className="text-2xl font-bold text-deep leading-tight mt-0.5">
                {teacherCount}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-success text-[11px]">
              <TrendingUp size={13} />
              <span className="font-normal text-muted">Active staff</span>
            </span>
            <div className="text-right">
              <span className="font-bold text-deep text-xs">{teachersOnLeave}</span>{' '}
              <span className="text-muted text-[11px]">On Leave Today</span>
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary">Today's Attendance</p>
              <p className="text-2xl font-bold text-deep leading-tight mt-0.5">
                {attPercent}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            {todayAtt.hasData ? (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-success text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />
                  <span className="font-normal text-muted">{todayAtt.present} Present</span>
                </span>
                <div className="text-right">
                  <span className="font-bold text-deep text-xs">{attAbsent}</span>{' '}
                  <span className="text-muted text-[11px]">Absent Today</span>
                </div>
              </>
            ) : (
              <span className="text-muted text-[11px]">Attendance not yet marked today</span>
            )}
          </div>
        </div>

        {/* Fees Collected */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs hover:shadow-card transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center font-bold text-base shrink-0">
              ₹
            </div>
            <div>
              <p className="text-xs font-semibold text-secondary">Fees Collected</p>
              <p className="text-2xl font-bold text-deep leading-tight mt-0.5">
                {formatINR(feeStats.totalPaid)}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            {hasAnyFees ? (
              <>
                <div className="flex-1 mr-3">
                  <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-forest h-full rounded-full"
                      style={{ width: `${feeStats.collectionPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted mt-1">
                    {feeStats.collectionPercent}% of {formatINR(feeStats.totalBilled)} target
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-deep text-xs">{formatINR(feeStats.totalPending)}</span>{' '}
                  <span className="text-muted text-[11px]">Pending</span>
                </div>
              </>
            ) : (
              <span className="text-muted text-[11px]">No fee records yet</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Needs Attention | Attendance Chart | Today's Schedule ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Needs Attention */}
        <Card padding={false} className="flex flex-col justify-between">
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Needs Attention</h3>
              {needsAttentionTotal > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold">
                  {needsAttentionTotal}
                </span>
              )}
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            {/* Low Attendance */}
            <div
              onClick={() => navigate('/attendance')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-danger-light text-danger-text flex items-center justify-center shrink-0">
                  <Users size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {lowAttendanceCount > 0 ? `${lowAttendanceCount} Students` : 'No Alerts'}
                  </p>
                  <p className="text-[11px] text-muted">Attendance below 75%</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Pending Admissions */}
            <div
              onClick={() => navigate('/admissions')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning-light text-warning-text flex items-center justify-center shrink-0">
                  <BookOpen size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {admissionApplications > 0 ? `${admissionApplications} Applications` : 'No Pending'}
                  </p>
                  <p className="text-[11px] text-muted">Awaiting admission review</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Pending Fees */}
            <div
              onClick={() => navigate('/fees')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                  ₹
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {feeStats.pendingStudents > 0 ? formatINR(feeStats.totalPending) : '—'}
                  </p>
                  <p className="text-[11px] text-muted">
                    Fees pending from {feeStats.pendingStudents} student{feeStats.pendingStudents !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Leave Requests */}
            <div
              onClick={() => navigate('/leaves')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center shrink-0">
                  <GraduationCap size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {pendingLeaves > 0 ? `${pendingLeaves} Requests` : 'No Pending'}
                  </p>
                  <p className="text-[11px] text-muted">Teacher leave requests pending</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Timetable Conflicts */}
            <div
              onClick={() => navigate('/timetable')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-info-light text-info-text flex items-center justify-center shrink-0">
                  <ShieldAlert size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors">
                    {timetableConflicts > 0 ? `${timetableConflicts} Conflicts` : 'No Conflicts'}
                  </p>
                  <p className="text-[11px] text-muted">Timetable conflicts detected</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-muted group-hover:text-deep transition-colors" />
            </div>
          </div>
        </Card>

        {/* Attendance Overview (Area Chart) */}
        <Card padding={false} className="flex flex-col justify-between">
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Attendance Overview</h3>
            <select
              value={attendancePeriod}
              onChange={(e) => setAttendancePeriod(e.target.value)}
              className="text-xs text-secondary bg-surface px-2.5 py-1 rounded-md cursor-pointer border border-border focus:outline-none font-medium"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <div className="p-4 pt-3">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-2xl font-bold text-deep">
                  {currentAvg !== null ? `${currentAvg}%` : 'N/A'}
                </span>
                <span className="text-xs text-muted ml-2">Avg ({attendancePeriod})</span>
              </div>
            </div>

            {chartData.length > 0 && validDays.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} ticks={[0, 25, 50, 75, 100]} />
                    <Tooltip
                      formatter={(val) => val !== undefined ? [`${val}%`, 'Attendance'] : ['No data', '']}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      stroke="#2D6A4F"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#attendanceGradient)"
                      dot={{ fill: '#2D6A4F', strokeWidth: 2, r: 3.5 }}
                      activeDot={{ r: 5, fill: '#2D6A4F' }}
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-muted">
                No attendance records for {attendancePeriod.toLowerCase()}
              </div>
            )}
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card padding={false} className="flex flex-col justify-between">
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Today's Schedule</h3>
            <button
              onClick={() => navigate('/timetable')}
              className="text-xs font-semibold text-forest hover:underline"
            >
              View Full Timetable
            </button>
          </div>

          <div className="p-4 space-y-3">
            {todaySchedule.length === 0 ? (
              <p className="text-xs text-muted py-8 text-center">No timetable published for today.</p>
            ) : (
              todaySchedule.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className={`flex items-start justify-between border-l-2 ${PERIOD_COLORS[index % PERIOD_COLORS.length]} pl-3 py-0.5`}
                >
                  <div>
                    <span className="text-[11px] font-semibold text-muted block">
                      {formatTime(item.startTime)}
                      {item.endTime ? ` – ${formatTime(item.endTime)}` : ''}
                    </span>
                    <p className="text-xs font-bold text-deep leading-snug mt-0.5">
                      {item.isLunch ? 'Lunch Break' : item.isBreak ? 'Break' : item.isAssembly ? 'Assembly' : item.subject || 'Period'}
                    </p>
                    <p className="text-[11px] text-muted">
                      {item.className}{item.section ? ` · ${item.section}` : ''}{item.room ? ` · Room ${item.room}` : ''}
                    </p>
                  </div>
                  {(item.isLunch || item.isBreak) ? (
                    <Coffee size={15} className="text-muted shrink-0 mt-1" />
                  ) : (
                    <span className="text-[11px] font-medium text-secondary text-right shrink-0">
                      {item.teacher || ''}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Class Attendance | Fee Donut | Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance by Class */}
        <Card padding={false} className="flex flex-col justify-between">
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Attendance by Class</h3>
            <select
              value={classAttendancePeriod}
              onChange={(e) => setClassAttendancePeriod(e.target.value)}
              className="text-xs text-secondary bg-surface px-2.5 py-1 rounded-md cursor-pointer border border-border focus:outline-none font-medium"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <div className="p-4">
            {currentClassAttendance.length === 0 ? (
              <p className="text-xs text-muted py-8 text-center">No class attendance data for {classAttendancePeriod.toLowerCase()}.</p>
            ) : (
              <>
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted uppercase pb-2 border-b border-border/60">
                  <span>Class</span>
                  <span>Average Attendance</span>
                </div>
                <div className="space-y-3 mt-3">
                  {currentClassAttendance.map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-deep w-20 truncate">{row.class}</span>
                      <div className="flex-1 mx-4 flex items-center gap-2">
                        <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.percentage >= 75 ? 'bg-forest' : 'bg-danger'}`}
                            style={{ width: `${Math.min(row.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-deep text-xs w-11 text-right">
                          {row.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Fee Collection Overview */}
        <Card padding={false} className="flex flex-col justify-between">
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Fee Collection Overview</h3>
            <button
              onClick={() => navigate('/fees')}
              className="text-xs font-semibold text-forest hover:underline"
            >
              View Fees
            </button>
          </div>

          <div className="p-4 flex items-center justify-between gap-2">
            {!hasAnyFees ? (
              <p className="text-xs text-muted py-8 w-full text-center">No fee records found.</p>
            ) : (
              <>
                {/* Donut */}
                <div className="w-40 h-40 relative flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feeDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={3}
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
                    <span className="text-sm font-bold text-deep">{formatINR(feeStats.totalPaid)}</span>
                    <span className="text-[10px] text-muted font-medium">Collected</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2.5 flex-1 pl-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-forest" />
                      <span className="text-xs font-medium text-secondary">Collected</span>
                    </div>
                    <p className="text-sm font-bold text-deep pl-4">
                      {formatINR(feeStats.totalPaid)}{' '}
                      <span className="text-xs font-normal text-muted">({feeStats.collectionPercent}%)</span>
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                      <span className="text-xs font-medium text-secondary">Pending</span>
                    </div>
                    <p className="text-sm font-bold text-deep pl-4">
                      {formatINR(feeStats.totalPending)}{' '}
                      <span className="text-xs font-normal text-muted">({100 - feeStats.collectionPercent}%)</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <span className="text-[11px] text-muted block">Total Billed</span>
                    <span className="text-xs font-bold text-deep">{formatINR(feeStats.totalBilled)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card padding={false} className="flex flex-col justify-between">
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Recent Activity</h3>
            <button
              onClick={() => navigate('/recent-activity')}
              className="text-xs font-semibold text-forest hover:underline"
            >
              View All
            </button>
          </div>

          <div className="p-4 space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted py-8 text-center">No recent activity recorded.</p>
            ) : (
              recentActivity.map((log, index) => {
                const { Icon, color } = getActivityStyle(log.action, log.entity);
                const timeStr = new Date(log.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div key={log._id || index} className="flex items-start gap-3">
                    <span className="text-[10px] font-medium text-muted w-14 shrink-0 pt-0.5">{timeStr}</span>
                    <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center shrink-0`}>
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-deep truncate leading-tight capitalize">
                        {log.action?.replace(/_/g, ' ')} {log.entity}
                      </p>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        by {log.actor?.name || 'Unknown'}{log.actor?.role ? ` (${log.actor.role.replace(/_/g, ' ')})` : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ── Footer ── */}
      <footer className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
        <p>© 2026 Instique School Management System. All rights reserved.</p>
        <p className="font-medium">Version 1.0.0</p>
      </footer>
    </div>
  );
}
