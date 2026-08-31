import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, GraduationCap, DollarSign, ClipboardCheck, TrendingUp, TrendingDown,
  Calendar, Download, RefreshCw, AlertTriangle, AlertCircle, BookOpen,
  BookMarked, Trophy, MessageSquare, CheckCircle2, Clock, ShieldAlert,
  ChevronRight, ArrowUpRight, Filter, ChevronDown, Award, PieChart as PieIcon,
  BarChart2, FileText, CheckCircle, XCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { analyticsApi } from '../../api/analytics.api';
import { academicApi } from '../../api/academic.api';

// Currency Formatter
function formatINR(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${num.toLocaleString('en-IN')}`;
}

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_session', label: 'This Academic Session' },
  { value: 'custom', label: 'Custom Range' },
];

export default function Reports() {
  const navigate = useNavigate();

  // Filter States
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Active Tab Filter (Quick Jump / View)
  const [activeSectionTab, setActiveSectionTab] = useState('all');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Data States
  const [overview, setOverview] = useState(null);
  const [studentsData, setStudentsData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [admissionsData, setAdmissionsData] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [homeworkData, setHomeworkData] = useState(null);
  const [operationsData, setOperationsData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch Academic Master Data
  useEffect(() => {
    academicApi.getAcademicYears({ limit: 50 }).then((res) => {
      const yrs = res.data || [];
      setAcademicYears(yrs);
      const curr = yrs.find((y) => y.isCurrent) || yrs[0];
      if (curr) setSelectedYear(curr._id);
    }).catch(() => {});

    academicApi.getClasses({ limit: 100 }).then((res) => {
      setClasses(res.data || []);
    }).catch(() => {});

    academicApi.getSections({ limit: 100 }).then((res) => {
      setSections(res.data || []);
    }).catch(() => {});
  }, []);

  // Filter query payload
  const queryParams = useMemo(() => {
    const p = {
      period: selectedPeriod,
      academicYear: selectedYear || undefined,
      schoolClass: selectedClass || undefined,
      section: selectedSection || undefined,
    };
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      p.startDate = customStartDate;
      p.endDate = customEndDate;
    }
    return p;
  }, [selectedPeriod, selectedYear, selectedClass, selectedSection, customStartDate, customEndDate]);

  // Main Analytics Data Fetcher
  const fetchAllAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        studentsRes,
        attendanceRes,
        academicsRes,
        feesRes,
        admissionsRes,
        teachersRes,
        homeworkRes,
        operationsRes,
        insightsRes,
        activityRes,
      ] = await Promise.allSettled([
        analyticsApi.getOverview(queryParams),
        analyticsApi.getStudents(queryParams),
        analyticsApi.getAttendance(queryParams),
        analyticsApi.getAcademics(queryParams),
        analyticsApi.getFees(queryParams),
        analyticsApi.getAdmissions(queryParams),
        analyticsApi.getTeachers(queryParams),
        analyticsApi.getHomework(queryParams),
        analyticsApi.getOperations(),
        analyticsApi.getInsights(),
        analyticsApi.getActivity(10),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (studentsRes.status === 'fulfilled') setStudentsData(studentsRes.value.data);
      if (attendanceRes.status === 'fulfilled') setAttendanceData(attendanceRes.value.data);
      if (academicsRes.status === 'fulfilled') setAcademicData(academicsRes.value.data);
      if (feesRes.status === 'fulfilled') setFeeData(feesRes.value.data);
      if (admissionsRes.status === 'fulfilled') setAdmissionsData(admissionsRes.value.data);
      if (teachersRes.status === 'fulfilled') setTeacherData(teachersRes.value.data);
      if (homeworkRes.status === 'fulfilled') setHomeworkData(homeworkRes.value.data);
      if (operationsRes.status === 'fulfilled') setOperationsData(operationsRes.value.data);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data || []);
      if (activityRes.status === 'fulfilled') setRecentActivity(activityRes.value.data || []);
    } catch (e) {
      toast.error('Failed to load some analytics sections');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Export Analytics Report
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await analyticsApi.exportReport(queryParams);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `instique-analytics-report-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Analytics report exported successfully');
    } catch {
      toast.error('Failed to export analytics report');
    } finally {
      setExporting(false);
    }
  };

  const kpis = overview?.kpis || {};

  return (
    <div className="space-y-6 w-full pb-12">
      {/* ── 1. Page Header & Global Filter Controls ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">Reports & Analytics</h1>
          <p className="text-secondary text-xs mt-1 max-w-xl leading-relaxed">
            Understand school performance, trends, academic growth, and areas that need attention.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchAllAnalytics} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          <Button size="sm" onClick={handleExport} loading={exporting} className="gap-1.5 text-xs">
            <Download size={14} /> Export Report
          </Button>
        </div>
      </div>

      {/* ── 2. Unified Filter Toolbar ── */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Session Selector */}
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="font-semibold text-muted text-[11px] uppercase tracking-wide">Session:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="font-semibold text-muted text-[11px] uppercase tracking-wide">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Custom Date Pickers */}
          {selectedPeriod === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-deep"
              />
              <span className="text-muted text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-deep"
              />
            </div>
          )}

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="font-semibold text-muted text-[11px] uppercase tracking-wide">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
              className="px-3 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          {selectedClass && (
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="font-semibold text-muted text-[11px] uppercase tracking-wide">Section:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Sections</option>
                {sections
                  .filter((s) => s.schoolClass === selectedClass)
                  .map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {(selectedClass || selectedSection || selectedPeriod !== 'this_month') && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSelectedPeriod('this_month');
                setSelectedClass('');
                setSelectedSection('');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-muted hover:text-deep ml-auto"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Section Jump Tabs */}
        <div className="pt-2.5 border-t border-border/60 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'students', label: 'Students' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'academics', label: 'Academics' },
            { id: 'fees', label: 'Fees' },
            { id: 'admissions', label: 'Admissions' },
            { id: 'teachers', label: 'Teachers' },
            { id: 'homework', label: 'Homework & Ops' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeSectionTab === tab.id
                  ? 'bg-primary text-white font-semibold shadow-2xs'
                  : 'text-secondary hover:bg-slate-100 hover:text-deep'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Executive Overview KPI Grid (6 Cards) ── */}
      {(activeSectionTab === 'all' || activeSectionTab === 'overview') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
          {/* Total Students */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <Users size={16} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Students</span>
            </div>
            <div className="my-2">
              <p className="text-2xl font-bold text-deep leading-none tracking-tight">
                {loading ? '...' : (kpis.totalStudents?.value ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              {kpis.totalStudents?.change !== null ? (
                <span className={`font-semibold ${kpis.totalStudents?.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpis.totalStudents?.change >= 0 ? '+' : ''}{kpis.totalStudents?.change}%
                </span>
              ) : <span className="text-muted">—</span>}
              <span className="text-muted text-[10px]">vs prev period</span>
            </div>
          </div>

          {/* Total Teachers */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <GraduationCap size={16} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Teachers</span>
            </div>
            <div className="my-2">
              <p className="text-2xl font-bold text-deep leading-none tracking-tight">
                {loading ? '...' : (kpis.totalTeachers?.value ?? 0)}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              {kpis.totalTeachers?.change !== null ? (
                <span className={`font-semibold ${kpis.totalTeachers?.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpis.totalTeachers?.change >= 0 ? '+' : ''}{kpis.totalTeachers?.change}%
                </span>
              ) : <span className="text-muted">—</span>}
              <span className="text-muted text-[10px]">vs prev period</span>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <ClipboardCheck size={16} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Attendance</span>
            </div>
            <div className="my-2">
              <p className="text-2xl font-bold text-deep leading-none tracking-tight">
                {loading ? '...' : (kpis.attendanceRate?.value ?? '—')}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              {kpis.attendanceRate?.change ? (
                <span className={`font-semibold ${kpis.attendanceRate?.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpis.attendanceRate.change}
                </span>
              ) : <span className="text-muted">—</span>}
              <span className="text-muted text-[10px]">vs prev period</span>
            </div>
          </div>

          {/* Fees Collected */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                ₹
              </div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Collected</span>
            </div>
            <div className="my-2">
              <p className="text-2xl font-bold text-deep leading-none tracking-tight">
                {loading ? '...' : formatINR(kpis.feesCollected?.value)}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              {kpis.feesCollected?.change ? (
                <span className={`font-semibold ${kpis.feesCollected?.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpis.feesCollected.change}
                </span>
              ) : <span className="text-muted">—</span>}
              <span className="text-muted text-[10px]">vs prev period</span>
            </div>
          </div>

          {/* Pending Fees */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                ₹
              </div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Pending</span>
            </div>
            <div className="my-2">
              <p className="text-2xl font-bold text-deep leading-none tracking-tight">
                {loading ? '...' : formatINR(kpis.pendingFees?.value)}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              {kpis.pendingFees?.change ? (
                <span className={`font-semibold ${kpis.pendingFees?.isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {kpis.pendingFees.change}
                </span>
              ) : <span className="text-muted">—</span>}
              <span className="text-muted text-[10px]">outstanding</span>
            </div>
          </div>

          {/* Active Admissions */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen size={16} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Admissions</span>
            </div>
            <div className="my-2">
              <p className="text-2xl font-bold text-deep leading-none tracking-tight">
                {loading ? '...' : (kpis.activeAdmissions?.value ?? 0)}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              {kpis.activeAdmissions?.change ? (
                <span className={`font-semibold ${kpis.activeAdmissions?.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpis.activeAdmissions.change}
                </span>
              ) : <span className="text-muted">—</span>}
              <span className="text-muted text-[10px]">in period</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Actionable Insights & Attention Panel ── */}
      {insights.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={14} />
              </div>
              <h3 className="text-sm font-bold text-deep tracking-tight">Insights & Attention Areas</h3>
            </div>
            <span className="text-xs text-muted font-medium">{insights.length} operational items</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                onClick={() => insight.link && navigate(insight.link)}
                className="p-3.5 rounded-xl border border-border/80 bg-slate-50/60 hover:bg-slate-50 hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-deep group-hover:text-primary transition-colors">
                      {insight.title}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      insight.severity === 'danger' ? 'bg-rose-500' : insight.severity === 'warning' ? 'bg-amber-500' : 'bg-primary'
                    }`} />
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {insight.message}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-primary font-semibold">
                  <span>{insight.actionText || 'Take Action'}</span>
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Student Analytics Section ── */}
      {(activeSectionTab === 'all' || activeSectionTab === 'students') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-deep tracking-tight">Student Analytics</h2>
            <span className="text-xs text-muted font-medium">Enrollment & Demographics</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Enrollment Trend */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Enrollment Trend</h3>
                  <p className="text-xs text-muted mt-0.5">Timeline of student enrollments</p>
                </div>
                <Badge color="primary" size="xs">Live Timeline</Badge>
              </div>

              <div className="h-60 w-full">
                {(!studentsData?.enrollmentTrend || studentsData.enrollmentTrend.length === 0) ? (
                  <EmptyState title="No Enrollment Data" description="No new student enrollments recorded for this period." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentsData.enrollmentTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="studentTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="enrolled" stroke="#6C5CE7" strokeWidth={2.5} fillOpacity={1} fill="url(#studentTrendGrad)" dot={{ fill: '#6C5CE7', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Gender Distribution Donut */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Gender Distribution</h3>
                <span className="text-xs text-muted">{studentsData?.summary?.active || 0} active</span>
              </div>

              <div className="h-44 w-full relative flex items-center justify-center">
                {(!studentsData?.genderDistribution || studentsData.genderDistribution.every(g => g.value === 0)) ? (
                  <p className="text-xs text-muted italic">No gender records available</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studentsData.genderDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={68}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {studentsData.genderDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Gender Legend */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs">
                {(studentsData?.genderDistribution || []).map((g) => (
                  <div key={g.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="text-muted">{g.name}:</span>
                    <span className="font-bold text-deep">{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Students by Class Bar Chart */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Students by Class</h3>
                <p className="text-xs text-muted mt-0.5">Enrolled student counts and capacity breakdown</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(!studentsData?.studentsByClass || studentsData.studentsByClass.length === 0) ? (
                <div className="col-span-full py-8 text-center text-xs text-muted italic">
                  No class distribution data available.
                </div>
              ) : (
                studentsData.studentsByClass.map((c) => (
                  <div key={c.class} className="p-3 bg-slate-50/70 border border-border/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-deep truncate">{c.class}</span>
                      <span className="font-extrabold text-primary">{c.count} students</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, c.percentage)}%` }} />
                    </div>
                    <div className="flex justify-end text-[10px] text-muted">
                      <span>{c.percentage}% of total</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Attendance Analytics Section ── */}
      {(activeSectionTab === 'all' || activeSectionTab === 'attendance') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-deep tracking-tight">Attendance Analytics</h2>
            <span className="text-xs text-muted font-medium">Daily Tracking & Compliance</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Attendance Trend Chart */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Attendance Rate Trend</h3>
                  <p className="text-xs text-muted mt-0.5">Daily overall attendance percentage across school</p>
                </div>
                <Badge color="success" size="xs">
                  {attendanceData?.summary?.overallRate || '—'}
                </Badge>
              </div>

              <div className="h-60 w-full">
                {(!attendanceData?.trend || attendanceData.trend.length === 0) ? (
                  <EmptyState title="No Attendance Logs" description="No daily attendance marked for the selected parameters." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceData.trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="attTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.16} />
                          <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} ticks={[0, 25, 50, 75, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="percentage" stroke="#6C5CE7" strokeWidth={2.5} fillOpacity={1} fill="url(#attTrendGrad)" dot={{ fill: '#6C5CE7', stroke: '#FFFFFF', strokeWidth: 2, r: 3.5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Students Below 75% Attention List */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Below Threshold (&lt;75%)</h3>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  {attendanceData?.studentsNeedingAttention?.length || 0} students
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-60 pr-1">
                {(!attendanceData?.studentsNeedingAttention || attendanceData.studentsNeedingAttention.length === 0) ? (
                  <div className="py-12 text-center text-xs text-muted flex flex-col items-center">
                    <CheckCircle size={24} className="text-emerald-500 mb-1 opacity-70" />
                    <span>All students have met or exceeded attendance goals.</span>
                  </div>
                ) : (
                  attendanceData.studentsNeedingAttention.map((s) => (
                    <div key={s.studentId} className="p-2.5 bg-slate-50 border border-border/80 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-deep leading-tight truncate max-w-[140px]">{s.name}</p>
                        <p className="text-[10px] text-muted">{s.className} • Adm: {s.admissionNo || '—'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-600 text-xs">{s.rate}%</span>
                        <p className="text-[10px] text-muted">{s.absentDays} days absent</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-border/60">
                <Button variant="ghost" size="xs" onClick={() => navigate('/attendance')} className="w-full text-xs text-primary justify-center">
                  Open Attendance Module <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Academic Performance Section ── */}
      {(activeSectionTab === 'all' || activeSectionTab === 'academics') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-deep tracking-tight">Academic Performance</h2>
            <span className="text-xs text-muted font-medium">Exams, Marks & Subject Analysis</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Performance by Subject */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Performance by Subject</h3>
                  <p className="text-xs text-muted mt-0.5">Average marks achieved across evaluations</p>
                </div>
                <span className="text-xs text-muted font-bold">
                  Pass Rate: {academicData?.summary?.passPercentage || '—'}
                </span>
              </div>

              {(!academicData?.performanceBySubject || academicData.performanceBySubject.length === 0) ? (
                <div className="py-12 text-center text-xs text-muted italic">
                  No exam marks recorded for the active academic criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {academicData.performanceBySubject.map((subj) => (
                    <div key={subj.subjectName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-deep">{subj.subjectName}</span>
                        <span className="font-bold text-deep">{subj.avgMarks} / 100</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, subj.avgMarks)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grade Distribution */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-deep uppercase tracking-wider mb-1">Grade Distribution</h3>
                <p className="text-xs text-muted mb-4">Overall evaluation grade counts</p>

                {(!academicData?.gradeDistribution || academicData.gradeDistribution.length === 0) ? (
                  <p className="text-xs text-muted italic text-center py-8">No grades recorded.</p>
                ) : (
                  <div className="space-y-2.5">
                    {academicData.gradeDistribution.map((g) => (
                      <div key={g.grade} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                        <span className="font-bold text-deep">Grade {g.grade}</span>
                        <span className="font-semibold text-primary">{g.count} students</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button variant="outline" size="xs" onClick={() => navigate('/exams')} className="w-full mt-4 justify-center">
                View Exams & Leaderboards
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Fee Collection Analytics Section ── */}
      {(activeSectionTab === 'all' || activeSectionTab === 'fees') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-base font-bold text-deep tracking-tight">Fee Collection Analytics</h2>
            <span className="text-xs text-muted font-medium">Revenue, Overdues & Collection Timeline</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Fee Collection Timeline */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Collection Timeline</h3>
                  <p className="text-xs text-muted mt-0.5">Daily/monthly payments received</p>
                </div>
                <Badge color="success" size="xs">
                  {feeData?.summary?.collectionRate || '0%'} Collection Rate
                </Badge>
              </div>

              <div className="h-60 w-full">
                {(!feeData?.timeline || feeData.timeline.length === 0) ? (
                  <EmptyState title="No Payment Activity" description="No fee payments recorded in this timeframe." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feeData.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip formatter={(val) => [formatINR(val), 'Collected']} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="amount" fill="#6C5CE7" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Collected vs. Pending Donut */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Collection Ledger</h3>
                <span className="text-xs text-muted font-bold">Total: {formatINR(feeData?.summary?.totalTarget)}</span>
              </div>

              <div className="h-44 w-full relative flex items-center justify-center">
                {(!feeData?.donut || feeData.donut.every(d => d.value === 0)) ? (
                  <p className="text-xs text-muted italic">No fee structure data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feeData.donut}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {feeData.donut.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [formatINR(val), 'Amount']} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-border/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Collected:</span>
                  <span className="font-bold text-deep">{formatINR(feeData?.summary?.collected)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending:</span>
                  <span className="font-bold text-deep">{formatINR(feeData?.summary?.pending)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. Admissions Funnel & Staff Operations Section ── */}
      {(activeSectionTab === 'all' || activeSectionTab === 'admissions' || activeSectionTab === 'teachers') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Admissions Funnel */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Admissions Conversion Funnel</h3>
                  <p className="text-xs text-muted mt-0.5">Workflow stages from application to enrollment</p>
                </div>
                <Badge color="primary" size="xs">
                  {admissionsData?.summary?.conversionRate || '0%'} Enrolled
                </Badge>
              </div>

              {(!admissionsData?.funnel || admissionsData.funnel.every(f => f.count === 0)) ? (
                <p className="text-xs text-muted italic text-center py-10">No admissions applications in this period.</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {admissionsData.funnel.map((stage) => (
                    <div key={stage.stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-deep">{stage.stage}</span>
                        <span className="font-bold text-deep">{stage.count} ({stage.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, stage.percentage)}%`, backgroundColor: stage.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button variant="ghost" size="xs" onClick={() => navigate('/admissions')} className="w-full mt-4 justify-center text-primary text-xs">
              Manage Admissions Workflow <ChevronRight size={13} />
            </Button>
          </div>

          {/* Teacher & Staff Distribution */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Staff & Department Breakdown</h3>
                  <p className="text-xs text-muted mt-0.5">{teacherData?.summary?.active || 0} active teachers on campus</p>
                </div>
                <Badge color="info" size="xs">
                  {teacherData?.summary?.onLeaveToday || 0} on leave
                </Badge>
              </div>

              {(!teacherData?.departmentDistribution || teacherData.departmentDistribution.length === 0) ? (
                <p className="text-xs text-muted italic text-center py-10">No teacher departmental records available.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {teacherData.departmentDistribution.map((d) => (
                    <div key={d.department} className="p-3 bg-slate-50 border border-border/80 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-semibold text-deep truncate">{d.department}</span>
                      <span className="text-xs font-bold text-primary">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted">Pending leave requests:</span>
              <span className="font-bold text-amber-600">{teacherData?.summary?.pendingLeaves || 0} requests</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. Operations & Live Chronological Activity Stream ── */}
      {(activeSectionTab === 'all' || activeSectionTab === 'homework') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Operational Metrics Cards */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider mb-3">Communication & Operations</h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-border/60">
                <span className="text-muted block text-[11px]">Events Total</span>
                <span className="text-xl font-bold text-deep mt-0.5 block">{operationsData?.events?.total || 0}</span>
                <span className="text-[10px] text-primary">{operationsData?.events?.upcoming || 0} upcoming</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-border/60">
                <span className="text-muted block text-[11px]">Notices</span>
                <span className="text-xl font-bold text-deep mt-0.5 block">{operationsData?.notices?.total || 0}</span>
                <span className="text-[10px] text-muted">Circulars</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-border/60">
                <span className="text-muted block text-[11px]">Complaints</span>
                <span className="text-xl font-bold text-deep mt-0.5 block">{operationsData?.complaints?.total || 0}</span>
                <span className="text-[10px] text-emerald-600">{operationsData?.complaints?.resolutionRate || '0%'} resolved</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-border/60">
                <span className="text-muted block text-[11px]">Parent Meetings</span>
                <span className="text-xl font-bold text-deep mt-0.5 block">{operationsData?.meetings?.total || 0}</span>
                <span className="text-[10px] text-muted">Conducted</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/60 mt-3 flex items-center justify-between text-xs">
              <span className="text-muted">Homework assigned:</span>
              <span className="font-bold text-deep">{homeworkData?.summary?.total || 0} assignments</span>
            </div>
          </div>

          {/* Chronological Recent Activity Stream */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Live System Activity Stream</h3>
              <span className="text-xs text-muted font-medium">Real-time audit records</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted italic">
                  No system activity recorded yet.
                </div>
              ) : (
                recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="text-[10px] font-medium text-muted w-14 shrink-0 pt-0.5">
                      {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className={`w-7 h-7 rounded-xl ${item.color || 'bg-slate-100 text-slate-700'} flex items-center justify-center shrink-0`}>
                      <FileText size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-deep truncate leading-tight">{item.title}</p>
                      <p className="text-[11px] text-muted truncate mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end">
              <span className="text-[10px] text-muted">Showing latest {recentActivity.length} events</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
