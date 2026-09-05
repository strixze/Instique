import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Flame,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  ShieldCheck,
  Award,
  Filter,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { parentApi } from '../../api/parent.api';
import { attendanceApi } from '../../api/attendance.api';

const statusConfig = {
  present: {
    label: 'Present',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    badge: 'success',
    icon: CheckCircle2,
  },
  absent: {
    label: 'Absent',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    badge: 'danger',
    icon: XCircle,
  },
  late: {
    label: 'Late',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    badge: 'warning',
    icon: Clock,
  },
  leave: {
    label: 'On Leave',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    badge: 'info',
    icon: FileSpreadsheet,
  },
  holiday: {
    label: 'Holiday',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    badge: 'gray',
    icon: Calendar,
  },
  unknown: {
    label: 'No Record',
    bg: 'bg-slate-50 text-slate-400 border-slate-100',
    dot: 'bg-slate-300',
    badge: 'gray',
    icon: Calendar,
  },
};

export default function ParentAttendance() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calendar View State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Table Filter State
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchDate, setSearchDate] = useState('');

  // 1. Fetch Parent's Linked Children
  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const res = await parentApi.getMyChildren();
      const kids = res.data || [];
      setChildren(kids);
      if (kids.length > 0) {
        setSelectedChildId(kids[0].id || kids[0]._id);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to load children profiles');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Selected Child's Attendance & Analytics
  useEffect(() => {
    if (!selectedChildId) return;
    loadChildAttendance(selectedChildId);
  }, [selectedChildId]);

  const loadChildAttendance = async (studentId) => {
    setLoading(true);
    try {
      const res = await attendanceApi.getStudentAttendance(studentId);
      setAttendanceData(res.data);
    } catch (e) {
      toast.error(e?.message || 'Failed to load attendance records');
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children.find((c) => (c.id || c._id) === selectedChildId);
  const analytics = attendanceData?.analytics || {
    attendanceRate: 0,
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    holidayDays: 0,
    currentStreak: 0,
    monthlyBreakdown: [],
    dayOfWeekBreakdown: [],
    statusBreakdown: { present: 0, absent: 0, late: 0, leave: 0, holiday: 0 },
  };

  const logs = attendanceData?.logs || [];

  // Filter logs for table
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (searchDate) {
        const dStr = new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        if (!dStr.toLowerCase().includes(searchDate.toLowerCase())) return false;
      }
      return true;
    });
  }, [logs, statusFilter, searchDate]);

  // Calendar calculations
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create date lookup map from logs for the calendar
  const dateStatusMap = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      const d = new Date(l.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map[key] = l;
    });
    return map;
  }, [logs]);

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const handlePrint = () => {
    window.print();
  };

  // Threshold status check
  const rate = analytics.attendanceRate;
  const isHealthy = rate >= 85;
  const isWarning = rate >= 75 && rate < 85;
  const isCritical = rate < 75;

  return (
    <div className="space-y-6 w-full pb-16 print:p-0 print-timetable">

      {/* ── Page Header & Action Controls ── */}
      <div className="print:hidden">
        <PageHeader
          title="Attendance & Analytics"
          description="Real-time attendance history, monthly trends, and performance insights for your children."
          action={
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handlePrint} className="gap-2 text-xs">
                <Printer size={15} /> Print Attendance Report
              </Button>
            </div>
          }
        />
      </div>

      {/* ── Child Selector Tabs (for Multi-Child & Single Child) ── */}
      {children.length > 0 && (
        <div className="bg-white border border-border/80 rounded-2xl p-3 shadow-xs print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-forest ml-2 mr-1" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Select Child:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {children.map((child) => {
                const childId = child.id || child._id;
                const isSelected = childId === selectedChildId;
                return (
                  <button
                    key={childId}
                    onClick={() => setSelectedChildId(childId)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                      isSelected
                        ? 'bg-forest text-white border-forest shadow-md shadow-forest/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-border/80'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'
                      }`}
                    >
                      {child.firstName?.[0]}
                      {child.lastName?.[0]}
                    </div>
                    <span>
                      {child.firstName} {child.lastName}
                    </span>
                    {child.currentClass?.name && (
                      <span className={`text-[10px] opacity-80 px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}>
                        {child.currentClass.name}
                        {child.currentSection?.name ? `-${child.currentSection.name}` : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Print Header ── */}
      {selectedChild && (
        <div className="hidden print:block text-center border-b border-border pb-4 mb-6">
          <h1 className="text-2xl font-bold text-deep">Student Attendance Report</h1>
          <p className="text-sm text-muted mt-1">
            Student: <b>{selectedChild.firstName} {selectedChild.lastName}</b> | Class: <b>{selectedChild.currentClass?.name || '—'}</b> | Admission No: <b>{selectedChild.admissionNo || '—'}</b>
          </p>
          <p className="text-xs text-muted mt-0.5">Overall Attendance: <b>{analytics.attendanceRate}%</b> across {analytics.totalWorkingDays} working days</p>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading ? (
        <div className="h-72 flex flex-col items-center justify-center bg-white border border-border/80 rounded-2xl shadow-xs text-muted">
          <div className="w-9 h-9 border-3 border-forest/30 border-t-forest rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-secondary">Loading attendance metrics & analytics...</p>
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted shadow-xs">
          <Users size={48} className="mx-auto mb-3 opacity-30 text-forest" />
          <span className="font-semibold text-deep text-base">No Linked Children Found</span>
          <p className="text-xs text-muted mt-1">Please ensure your parent profile is linked to a registered student.</p>
        </div>
      ) : (
        <>
          {/* ── Health & Compliance Status Banner ── */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
              isHealthy
                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                : isWarning
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                : 'bg-rose-50/70 border-rose-200/80 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isHealthy ? 'bg-emerald-500 text-white' : isWarning ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {isHealthy ? <ShieldCheck size={20} /> : isWarning ? <Clock size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  {isHealthy
                    ? `Excellent Consistency (${rate}%)`
                    : isWarning
                    ? `Good Standing (${rate}%) — Close to 75% Minimum Criteria`
                    : `Critical Attention Required (${rate}%) — Below 75% Board Minimum`}
                </h4>
                <p className="text-xs opacity-90 mt-0.5">
                  {isHealthy
                    ? `${selectedChild?.firstName} is maintaining stellar classroom attendance above the mandatory 75% requirement.`
                    : isWarning
                    ? `Attendance is above the 75% requirement. Regular presence ensures eligibility for upcoming semester examinations.`
                    : `Attendance is under the statutory 75% requirement. Please submit medical/leave documentation if applicable.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/80 border border-current shadow-xs">
                {analytics.presentDays} / {analytics.totalWorkingDays} Working Days Present
              </span>
            </div>
          </div>

          {/* ── 5 Metric Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Overall Attendance Rate */}
            <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Overall Rate</span>
                <TrendingUp size={15} className="text-forest" />
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-deep tracking-tight">{analytics.attendanceRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, analytics.attendanceRate)}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-muted block mt-1.5">Req. Threshold: 75%</span>
              </div>
            </div>

            {/* Present Days */}
            <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Present Days</span>
                <CheckCircle2 size={15} className="text-emerald-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">{analytics.presentDays}</span>
                <span className="text-xs text-muted block mt-1">out of {analytics.totalWorkingDays} sessions</span>
              </div>
            </div>

            {/* Absent Days */}
            <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Absent Days</span>
                <XCircle size={15} className="text-rose-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-rose-700 tracking-tight">{analytics.absentDays}</span>
                <span className="text-xs text-muted block mt-1">unexcused absences</span>
              </div>
            </div>

            {/* Late & Leaves */}
            <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Late & Leaves</span>
                <Clock size={15} className="text-amber-600" />
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-amber-700 tracking-tight">{analytics.lateDays}</span>
                  <span className="text-xs text-muted">Late</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-2xl font-extrabold text-purple-700 tracking-tight">{analytics.leaveDays}</span>
                  <span className="text-xs text-muted">Leaves</span>
                </div>
                <span className="text-[10px] text-muted block mt-1.5">Approved excused entries</span>
              </div>
            </div>

            {/* Attendance Streak */}
            <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Active Streak</span>
                <Flame size={16} className="text-orange-500 fill-orange-500/20" />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-extrabold text-orange-600 tracking-tight">{analytics.currentStreak}</span>
                  <span className="text-xs font-semibold text-deep">Days</span>
                </div>
                <span className="text-[10px] text-muted block mt-1">Consecutive attendance 🔥</span>
              </div>
            </div>
          </div>

          {/* ── Analytics & Trend Section ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Attendance Trends Chart */}
            <div className="lg:col-span-2 bg-white border border-border/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                    <BarChart3 size={16} className="text-forest" />
                    Monthly Attendance Trends
                  </h3>
                  <p className="text-xs text-muted mt-0.5">Month-by-month attendance percentage vs 75% target</p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-forest"></span>
                    <span className="text-muted">Attendance Rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-rose-400"></span>
                    <span className="text-muted">75% Min. Line</span>
                  </div>
                </div>
              </div>

              {analytics.monthlyBreakdown.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-muted italic">
                  No monthly attendance records recorded yet.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-6 gap-2 items-end h-44 border-b border-border/80 pb-2 relative">
                    {/* 75% Target Line */}
                    <div
                      className="absolute left-0 right-0 border-b-2 border-dashed border-rose-300 pointer-events-none z-10"
                      style={{ bottom: '75%' }}
                    >
                      <span className="absolute -top-4 right-1 text-[9px] font-bold text-rose-500 bg-white px-1">75% Benchmark</span>
                    </div>

                    {analytics.monthlyBreakdown.map((m, idx) => {
                      const barHeight = Math.max(8, Math.min(100, m.rate));
                      const isHigh = m.rate >= 85;
                      const isLow = m.rate < 75;
                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-12 bg-slate-900 text-white text-[10px] rounded-lg px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                            <span className="font-bold">{m.month}:</span> {m.rate}% ({m.present} present, {m.absent} absent)
                          </div>

                          <div className="text-[11px] font-bold text-deep mb-1">{m.rate}%</div>
                          <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden">
                            <div
                              className={`w-full rounded-t-lg transition-all duration-500 ${
                                isHigh ? 'bg-forest hover:bg-forest/90' : isLow ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'
                              }`}
                              style={{ height: `${barHeight}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-semibold text-muted mt-2 truncate w-full text-center">
                            {m.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Monthly Summary Statistics Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 bg-slate-50 border border-border/60 rounded-xl text-center">
                      <span className="text-[10px] text-muted uppercase font-bold block">Avg. Presence</span>
                      <span className="text-sm font-bold text-forest mt-0.5 block">{analytics.attendanceRate}%</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-border/60 rounded-xl text-center">
                      <span className="text-[10px] text-muted uppercase font-bold block">Working Days</span>
                      <span className="text-sm font-bold text-deep mt-0.5 block">{analytics.totalWorkingDays} Days</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-border/60 rounded-xl text-center">
                      <span className="text-[10px] text-muted uppercase font-bold block">Absence Rate</span>
                      <span className="text-sm font-bold text-rose-600 mt-0.5 block">
                        {analytics.totalWorkingDays > 0 ? Math.round((analytics.absentDays / analytics.totalWorkingDays) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Day of Week Consistency */}
            <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-deep flex items-center gap-2 mb-1">
                  <CalendarDays size={16} className="text-forest" />
                  Day-of-Week Consistency
                </h3>
                <p className="text-xs text-muted mb-4">Class attendance rate by weekday</p>

                <div className="space-y-2.5">
                  {analytics.dayOfWeekBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-secondary">{item.day}</span>
                        <span className="text-deep font-semibold">
                          {item.total > 0 ? `${item.rate}% (${item.present}/${item.total})` : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-forest rounded-full transition-all duration-300"
                          style={{ width: `${item.total > 0 ? item.rate : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Composition Progress Ring */}
              <div className="pt-4 border-t border-border/70 mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-2">
                  Status Distribution
                </span>
                <div className="flex h-2.5 rounded-full overflow-hidden w-full bg-slate-100">
                  <div style={{ width: `${(analytics.presentDays / Math.max(1, analytics.totalWorkingDays)) * 100}%` }} className="bg-emerald-500" title="Present" />
                  <div style={{ width: `${(analytics.lateDays / Math.max(1, analytics.totalWorkingDays)) * 100}%` }} className="bg-amber-400" title="Late" />
                  <div style={{ width: `${(analytics.leaveDays / Math.max(1, analytics.totalWorkingDays)) * 100}%` }} className="bg-purple-400" title="Leave" />
                  <div style={{ width: `${(analytics.absentDays / Math.max(1, analytics.totalWorkingDays)) * 100}%` }} className="bg-rose-500" title="Absent" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted mt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Present</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Late</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span>Leave</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Absent</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Monthly Calendar Heatmap View ── */}
          <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                  <Calendar size={16} className="text-forest" />
                  Monthly Attendance Calendar
                </h3>
                <p className="text-xs text-muted mt-0.5">Visual representation of daily classroom attendance</p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevMonth} className="px-2">
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-xs font-bold text-deep min-w-32 text-center">
                  {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <Button variant="outline" size="sm" onClick={handleNextMonth} className="px-2">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-muted uppercase py-1">
                  {d}
                </div>
              ))}

              {/* Leading Empty Cells */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-16 rounded-xl bg-slate-50/50 border border-border/30"></div>
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const log = dateStatusMap[dateKey];
                const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();
                const dayOfWeek = new Date(year, month, dayNum).getDay();
                const isSunday = dayOfWeek === 0;

                const cfg = log ? statusConfig[log.status] || statusConfig.unknown : isSunday ? statusConfig.holiday : statusConfig.unknown;

                return (
                  <div
                    key={dayNum}
                    className={`min-h-16 p-2 rounded-xl border transition-all flex flex-col justify-between ${
                      isToday ? 'ring-2 ring-forest' : ''
                    } ${log ? cfg.bg : isSunday ? 'bg-slate-50/80 border-slate-200/60 text-slate-400' : 'bg-white border-border/60 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isToday ? 'text-forest' : 'text-deep'}`}>
                        {dayNum}
                      </span>
                      {log && <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>}
                    </div>

                    <div className="mt-1">
                      {log ? (
                        <div className="flex items-center gap-1 text-[10px] font-semibold">
                          <cfg.icon size={11} className="shrink-0" />
                          <span className="truncate capitalize">{cfg.label}</span>
                        </div>
                      ) : isSunday ? (
                        <span className="text-[10px] text-slate-400 font-medium italic">Sunday</span>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-normal">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Detailed Attendance Logs Table ── */}
          <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                  <CalendarDays size={16} className="text-forest" />
                  Detailed Attendance History
                </h3>
                <p className="text-xs text-muted mt-0.5">Chronological record of classroom attendance and notes</p>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-slate-50 border border-border rounded-xl px-2.5 py-1.5 text-xs">
                  <Filter size={13} className="text-muted" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-deep font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses ({logs.length})</option>
                    <option value="present">Present ({analytics.presentDays})</option>
                    <option value="absent">Absent ({analytics.absentDays})</option>
                    <option value="late">Late ({analytics.lateDays})</option>
                    <option value="leave">Leave ({analytics.leaveDays})</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Search date (e.g. Aug 2026)..."
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest w-full sm:w-48"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-border/80 bg-slate-50/80 text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 rounded-l-xl">Date & Day</th>
                    <th className="px-4 py-3">Attendance Status</th>
                    <th className="px-4 py-3">Class & Section</th>
                    <th className="px-4 py-3">Subject / Session</th>
                    <th className="px-4 py-3">Recorded By</th>
                    <th className="px-4 py-3 rounded-r-xl">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted">
                        No attendance records matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => {
                      const cfg = statusConfig[log.status] || statusConfig.unknown;
                      const dateObj = new Date(log.date);
                      const formattedDate = dateObj.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });

                      return (
                        <tr key={log._id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-deep block">{formattedDate}</span>
                            <span className="text-[10px] text-muted">{dayName}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg}`}
                            >
                              <cfg.icon size={12} className="shrink-0" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-700">
                            {log.class ? `${log.class} ${log.section ? `(${log.section})` : ''}` : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-medium">
                            {log.subject || 'Daily Homeroom'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {log.markedBy || 'Teacher / System'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="capitalize text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {log.source || 'Manual'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
