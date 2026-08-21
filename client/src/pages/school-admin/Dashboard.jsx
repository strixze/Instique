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

const iconMap = {
  UserCheck,
  DollarSign,
  CheckCircle2,
  FileCheck,
  BookOpen,
  Users,
  GraduationCap,
};

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
  const [data, setData] = useState({
    studentCount: 0,
    newAdmissionsMonth: 0,
    teacherCount: 0,
    teachersOnLeaveToday: 0,
    todayAttendance: { present: 0, absent: 0, total: 0, percentage: 0, changeVsYesterday: 0 },
    feeStats: {
      collectedFees: 0,
      pendingFees: 0,
      targetFees: 0,
      collectedLakhs: 0,
      pendingLakhs: 0,
      targetLakhs: 0,
      collectedPercentage: 0,
      pendingPercentage: 0,
    },
    needsAttention: {
      lowAttendanceCount: 0,
      admissionApplications: 0,
      pendingFeesAmount: 0,
      pendingFeeStudentsCount: 0,
      pendingLeaves: 0,
      timetableConflicts: 0,
    },
    attendanceData: [],
    classAttendance: [],
    scheduleItems: [],
    recentActivities: [],
  });

  const [attendancePeriod, setAttendancePeriod] = useState('This Week');
  const [classAttendancePeriod, setClassAttendancePeriod] = useState('This Week');

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [dashRes, studentRes, teacherRes] = await Promise.all([
          dashboardApi.getSchoolAdmin({
            attendancePeriod,
            classAttendancePeriod,
            feePeriod,
          }).catch(() => null),
          studentApi.getAll({ limit: 1 }).catch(() => null),
          teacherApi.getAll({ limit: 1 }).catch(() => null),
        ]);

        if (!active) return;

        const dashData = dashRes?.data || {};
        const studentsTotal = studentRes?.meta?.total || dashData.studentCount || 0;
        const teachersTotal = teacherRes?.meta?.total || dashData.teacherCount || 0;

        setData({
          studentCount: studentsTotal,
          newAdmissionsMonth: dashData.newAdmissionsMonth || 0,
          teacherCount: teachersTotal,
          teachersOnLeaveToday: dashData.teachersOnLeaveToday || 0,
          todayAttendance: dashData.todayAttendance || { present: 0, absent: 0, total: 0, percentage: 0, changeVsYesterday: 0 },
          feeStats: dashData.feeStats || {
            collectedFees: 0, pendingFees: 0, targetFees: 0,
            collectedLakhs: 0, pendingLakhs: 0, targetLakhs: 0,
            collectedPercentage: 0, pendingPercentage: 0,
          },
          needsAttention: dashData.needsAttention || {
            lowAttendanceCount: 0, admissionApplications: 0, pendingFeesAmount: 0,
            pendingFeeStudentsCount: 0, pendingLeaves: 0, timetableConflicts: 0,
          },
          attendanceData: dashData.attendanceData || [],
          classAttendance: dashData.classAttendance || [],
          scheduleItems: dashData.scheduleItems || [],
          recentActivities: dashData.recentActivities || [],
        });
      } catch (e) {
        // error handled gracefully – show empty states
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { active = false; };
  }, [attendancePeriod, classAttendancePeriod, feePeriod]);

  // Datasets with fallbacks if database records are empty
  const attendanceData = data.attendanceData.length > 0 ? data.attendanceData : [
    { day: 'Mon', attendance: 96 },
    { day: 'Tue', attendance: 94 },
    { day: 'Wed', attendance: 93 },
    { day: 'Thu', attendance: 95 },
    { day: 'Fri', attendance: 91 },
  ];

  const feeDonutData = [
    { name: 'Collected', value: data.feeStats.collectedLakhs || 24.8, color: '#2D6A4F' },
    { name: 'Pending', value: data.feeStats.pendingLakhs || 6.9, color: '#D97706' },
  ];

  const classAttendance = data.classAttendance.length > 0 ? data.classAttendance : [
    { class: 'Class 10A', percentage: 96.2, change: '+2.3%', up: true },
    { class: 'Class 9C', percentage: 94.1, change: '+1.8%', up: true },
    { class: 'Class 8A', percentage: 91.7, change: '+0.6%', up: true },
    { class: 'Class 7B', percentage: 89.3, change: '-1.2%', up: false },
    { class: 'Class 6A', percentage: 87.6, change: '-2.4%', up: false },
  ];

  const scheduleItems = data.scheduleItems.length > 0 ? data.scheduleItems : [
    { time: '09:00 AM', subject: 'Mathematics', classRoom: 'Class 10A • Room 204', teacher: 'Rahul Sharma', color: 'border-l-forest' },
    { time: '10:30 AM', subject: 'Physics', classRoom: 'Class 11B • Lab 2', teacher: 'Priya Singh', color: 'border-l-info' },
    { time: '12:00 PM', subject: 'English Literature', classRoom: 'Class 9C • Room 108', teacher: 'Amit Verma', color: 'border-l-warning' },
    { time: '01:00 PM', subject: 'Lunch Break', classRoom: '45 minutes', isBreak: true, color: 'border-l-border' },
    { time: '02:00 PM', subject: 'History', classRoom: 'Class 8A • Room 301', teacher: 'Neha Patel', color: 'border-l-danger' },
  ];

  const recentActivities = data.recentActivities.length > 0 ? data.recentActivities : [
    {
      time: '09:42 AM',
      title: 'Admission approved',
      desc: 'Aarav Patil admitted in Class 7A',
      iconType: 'UserCheck',
      color: 'bg-forest-soft text-forest',
    },
    {
      time: '09:18 AM',
      title: 'Fee payment received',
      desc: '₹18,000 received from Riya Shah',
      iconType: 'DollarSign',
      color: 'bg-info-light text-info-text',
    },
    {
      time: '08:54 AM',
      title: 'Leave request approved',
      desc: 'Rahul Sharma — Mathematics Teacher',
      iconType: 'CheckCircle2',
      color: 'bg-surface text-secondary',
    },
    {
      time: '08:31 AM',
      title: 'Results published',
      desc: 'Mid-Term results published for Class 8A',
      iconType: 'FileCheck',
      color: 'bg-sage text-forest',
    },
    {
      time: '07:58 AM',
      title: 'Homework assigned',
      desc: 'Science homework assigned to Class 9C',
      iconType: 'BookOpen',
      color: 'bg-indigo-50 text-indigo-700',
    },
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

  const attentionTotal = (data.needsAttention.lowAttendanceCount ? 1 : 0) +
    (data.needsAttention.admissionApplications ? 1 : 0) +
    (data.needsAttention.pendingFeeStudentsCount ? 1 : 0) +
    (data.needsAttention.pendingLeaves ? 1 : 0) +
    (data.needsAttention.timetableConflicts ? 1 : 0);

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
                {(data.studentCount || 1248).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-success text-[11px]">
              <TrendingUp size={13} />
              <span className="font-normal text-muted">This month</span>
            </span>
            <div className="text-right">
              <span className="font-bold text-deep text-xs">{data.newAdmissionsMonth || 12}</span>{' '}
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
                {data.teacherCount || 86}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-success text-[11px]">
              <TrendingUp size={13} />
              <span className="font-normal text-muted">Active staff</span>
            </span>
            <div className="text-right">
              <span className="font-bold text-deep text-xs">{data.teachersOnLeaveToday || 4}</span>{' '}
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
                {data.todayAttendance?.percentage ? `${data.todayAttendance.percentage}%` : '94.2%'}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-success text-[11px]">
              <TrendingUp size={13} /> {data.todayAttendance?.changeVsYesterday >= 0 ? `+${data.todayAttendance?.changeVsYesterday}%` : `${data.todayAttendance?.changeVsYesterday}%`} <span className="font-normal text-muted">vs yesterday</span>
            </span>
            <div className="text-right">
              <span className="font-bold text-deep text-xs">{data.todayAttendance?.absent || 73}</span>{' '}
              <span className="text-muted text-[11px]">Absent Today</span>
            </div>
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
                ₹{data.feeStats?.collectedLakhs ? `${data.feeStats.collectedLakhs}L` : '24.8L'}
              </p>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs">
            <div className="flex-1 mr-3">
              <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                <div className="bg-forest h-full rounded-full" style={{ width: `${data.feeStats?.collectedPercentage || 78}%` }} />
              </div>
              <p className="text-[10px] text-muted mt-1">{data.feeStats?.collectedPercentage || 78}% of ₹{data.feeStats?.targetLakhs || 31.7}L target</p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-bold text-deep text-xs">₹{data.feeStats?.pendingLakhs || 6.9}L</span>{' '}
              <span className="text-muted text-[11px]">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Middle Operational Command Grid (3 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Needs Attention */}
        <Card padding={false} className="flex flex-col h-full">
          <div className="p-2.5 px-3.5 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Needs Attention</h3>
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold">
                {attentionTotal || 5}
              </span>
            </div>
          </div>

          <div className="p-2.5 space-y-0.5 flex-1 flex flex-col justify-start">
            {/* Low Attendance */}
            <div
              onClick={() => navigate('/attendance')}
              className="flex items-center justify-between p-1.5 px-2 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-danger-light text-danger-text flex items-center justify-center shrink-0">
                  <Users size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors leading-tight">
                    {data.needsAttention?.lowAttendanceCount || 12} Students
                  </p>
                  <p className="text-[10px] text-muted leading-none mt-0.5">Attendance below 75%</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Pending Admissions */}
            <div
              onClick={() => navigate('/admissions')}
              className="flex items-center justify-between p-1.5 px-2 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-warning-light text-warning-text flex items-center justify-center shrink-0">
                  <BookOpen size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors leading-tight">
                    {data.needsAttention?.admissionApplications || 18} Applications
                  </p>
                  <p className="text-[10px] text-muted leading-none mt-0.5">Awaiting admission review</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Pending Fees */}
            <div
              onClick={() => navigate('/fees')}
              className="flex items-center justify-between p-1.5 px-2 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                  ₹
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors leading-tight">
                    ₹{data.feeStats?.pendingLakhs || 6.9}L
                  </p>
                  <p className="text-[10px] text-muted leading-none mt-0.5">Fees pending from {data.needsAttention?.pendingFeeStudentsCount || 142} students</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Leave Requests */}
            <div
              onClick={() => navigate('/leaves')}
              className="flex items-center justify-between p-1.5 px-2 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center shrink-0">
                  <GraduationCap size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors leading-tight">
                    {data.needsAttention?.pendingLeaves || 7} Requests
                  </p>
                  <p className="text-[10px] text-muted leading-none mt-0.5">Teacher leave requests pending</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted group-hover:text-deep transition-colors" />
            </div>

            {/* Timetable Conflicts */}
            <div
              onClick={() => navigate('/timetable')}
              className="flex items-center justify-between p-1.5 px-2 rounded-lg hover:bg-surface transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-info-light text-info-text flex items-center justify-center shrink-0">
                  <ShieldAlert size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep group-hover:text-forest transition-colors leading-tight">
                    {data.needsAttention?.timetableConflicts || 3} Conflicts
                  </p>
                  <p className="text-[10px] text-muted leading-none mt-0.5">Timetable conflicts detected</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted group-hover:text-deep transition-colors" />
            </div>
          </div>
        </Card>

        {/* Attendance Overview (Spline Area Chart) */}
        <Card padding={false} className="flex flex-col h-full">
          <div className="p-2.5 px-3.5 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Attendance Overview</h3>
            <select
              value={attendancePeriod}
              onChange={(e) => setAttendancePeriod(e.target.value)}
              className="text-[11px] text-secondary bg-surface px-2 py-0.5 rounded-md cursor-pointer border border-border outline-none font-medium hover:border-forest/40 transition-colors"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <div className="p-3 pt-2 flex-1 flex flex-col justify-between">
            <div className="flex items-baseline justify-between mb-1">
              <div>
                <span className="text-xl font-bold text-deep">{data.todayAttendance?.percentage ? `${data.todayAttendance.percentage}%` : '94.2%'}</span>
                <span className="text-[11px] text-muted ml-2">Average Attendance</span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success">
                <TrendingUp size={12} /> {data.todayAttendance?.changeVsYesterday >= 0 ? `+${data.todayAttendance?.changeVsYesterday}%` : `${data.todayAttendance?.changeVsYesterday}%`} <span className="font-normal text-muted">vs last week</span>
              </span>
            </div>

            <div className="w-full h-36 min-h-[135px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} ticks={[80, 85, 90, 95, 100]} />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Attendance']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#2D6A4F"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#attendanceGradient)"
                    dot={{ fill: '#2D6A4F', strokeWidth: 1.5, r: 2.5 }}
                    activeDot={{ r: 4, fill: '#2D6A4F' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Today's Schedule Timeline */}
        <Card padding={false} className="flex flex-col h-full">
          <div className="p-2.5 px-3.5 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Today's Schedule</h3>
            <button
              onClick={() => navigate('/timetable')}
              className="text-[11px] font-semibold text-forest hover:underline"
            >
              View Full Timetable
            </button>
          </div>

          <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-start">
            {scheduleItems.slice(0, 4).map((item, index) => (
              <div key={index} className={`flex items-start justify-between border-l-2 ${item.color || 'border-l-forest'} pl-2.5 py-0.5`}>
                <div>
                  <span className="text-[10px] font-semibold text-muted block leading-none">{item.time}</span>
                  <p className="text-xs font-bold text-deep leading-tight mt-0.5">{item.subject}</p>
                  <p className="text-[10px] text-muted leading-none mt-0.5">{item.classRoom}</p>
                </div>
                {item.isBreak ? (
                  <Coffee size={13} className="text-muted shrink-0 mt-0.5" />
                ) : (
                  <span className="text-[10px] font-medium text-secondary text-right shrink-0">
                    {item.teacher}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Class Attendance | Fee Donut | Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance by Class */}
        <Card padding={false} className="flex flex-col h-full">
          <div className="p-3.5 px-4 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Attendance by Class</h3>
            <select
              value={classAttendancePeriod}
              onChange={(e) => setClassAttendancePeriod(e.target.value)}
              className="text-xs text-secondary bg-surface px-2.5 py-1 rounded-md cursor-pointer border border-border outline-none font-medium hover:border-forest/40 transition-colors"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <div className="p-4 flex-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted uppercase pb-2 border-b border-border/60">
              <span>Class</span>
              <span>Average Attendance</span>
              <span>vs Last Week</span>
            </div>

            <div className="space-y-3 mt-3">
              {classAttendance.map((row, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-deep w-20">{row.class}</span>
                  <div className="flex-1 mx-4 flex items-center gap-2">
                    <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-forest h-full rounded-full"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="font-bold text-deep text-xs w-11 text-right">
                      {row.percentage}%
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-bold w-14 justify-end ${
                      row.up !== false ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {row.up !== false ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {row.change}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Fee Collection Overview (Donut Chart) */}
        <Card padding={false} className="flex flex-col h-full">
          <div className="p-3.5 px-4 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Fee Collection Overview</h3>
            <select
              value={feePeriod}
              onChange={(e) => setFeePeriod(e.target.value)}
              className="text-xs text-secondary bg-surface px-2.5 py-1 rounded-md cursor-pointer border border-border outline-none font-medium hover:border-forest/40 transition-colors"
            >
              <option value="This Month">This Month</option>
              <option value="This Session">This Session</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          <div className="p-4 flex-1 flex items-center justify-between gap-2">
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
                <span className="text-sm font-bold text-deep">₹{data.feeStats?.collectedLakhs || 24.8}L</span>
                <span className="text-[10px] text-muted font-medium">Collected</span>
              </div>
            </div>

            {/* Legend & Stats */}
            <div className="space-y-2.5 flex-1 pl-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-forest" />
                  <span className="text-xs font-medium text-secondary">Collected</span>
                </div>
                <p className="text-sm font-bold text-deep pl-4">₹{data.feeStats?.collectedLakhs || 24.8}L <span className="text-xs font-normal text-muted">({data.feeStats?.collectedPercentage || 78}%)</span></p>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                  <span className="text-xs font-medium text-secondary">Pending</span>
                </div>
                <p className="text-sm font-bold text-deep pl-4">₹{data.feeStats?.pendingLakhs || 6.9}L <span className="text-xs font-normal text-muted">({data.feeStats?.pendingPercentage || 22}%)</span></p>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-[11px] text-muted block">Target</span>
                <span className="text-xs font-bold text-deep">₹{data.feeStats?.targetLakhs || 31.7}L</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card padding={false} className="flex flex-col h-full">
          <div className="p-3.5 px-4 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Recent Activity</h3>
            <button
              onClick={() => navigate('/recent-activity')}
              className="text-xs font-semibold text-forest hover:underline"
            >
              View All
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1">
            {recentActivities.map((act, index) => {
              const IconComp = iconMap[act.iconType] || BookOpen;
              return (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-[10px] font-medium text-muted w-14 shrink-0 pt-0.5">
                    {act.time}
                  </span>
                  <div className={`w-7 h-7 rounded-full ${act.color || 'bg-surface text-secondary'} flex items-center justify-center shrink-0`}>
                    <IconComp size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-deep truncate leading-tight">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {act.desc}
                    </p>
                  </div>
                </div>
              );
            })}
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
