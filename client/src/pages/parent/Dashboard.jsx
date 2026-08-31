import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { parentApi } from '../../api/parent.api';
import { parentMeetingApi } from '../../api/parentMeeting.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import {
  Users, GraduationCap, Calendar as CalendarIcon, Clock, ClipboardList,
  BookOpen, DollarSign, Trophy, Bell, AlertCircle, CheckCircle2, ChevronDown,
  ArrowRight, Eye, Check, Minus, X, Award, Sparkles, RefreshCw,
  FileText, School, MapPin, AlertTriangle, User
} from 'lucide-react';

const RSVP_BADGE = { PENDING: 'gray', GOING: 'success', MAYBE: 'warning', NOT_GOING: 'danger' };

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getRelativeDue = (dueDate) => {
  if (!dueDate) return '—';
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Overdue', color: 'danger' };
  if (diffDays === 0) return { label: 'Due Today', color: 'warning' };
  if (diffDays === 1) return { label: 'Due Tomorrow', color: 'warning' };
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, color: 'info' };
  return { label: formatDate(dueDate), color: 'gray' };
};

export default function ParentDashboard() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  // State
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [rsvpSavingId, setRsvpSavingId] = useState(null);


  // 1. Fetch authenticated parent's linked children
  const fetchChildren = useCallback(async () => {
    setChildrenLoading(true);
    try {
      const res = await parentApi.getMyChildren();
      const kids = res.data || [];
      setChildren(kids);
      if (kids.length > 0) {
        // Retain current selection if valid, else pick first child
        setSelectedChildId((prev) => {
          const exists = kids.some((k) => (k.id || k._id) === prev);
          return exists ? prev : (kids[0].id || kids[0]._id);
        });
      } else {
        setSelectedChildId('');
        setDashboardData(null);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load linked children');
      setChildren([]);
    } finally {
      setChildrenLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // 2. Fetch selected child's dashboard data
  const fetchChildDashboard = useCallback(async (childId) => {
    if (!childId) {
      setDashboardData(null);
      return;
    }

    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const res = await parentApi.getChildDashboard(childId);
      setDashboardData(res.data);
    } catch (err) {
      setDashboardError(err?.message || 'Failed to load student details');
      toast.error(err?.message || 'Unable to load dashboard for selected child');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchChildDashboard(selectedChildId);
    }
  }, [selectedChildId, fetchChildDashboard]);

  // Handle RSVP for Parent Meeting
  const handleRsvp = async (meetingId, status) => {
    setRsvpSavingId(meetingId);
    try {
      await parentMeetingApi.rsvp(meetingId, status);
      toast.success('Meeting response saved');
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          meetings: prev.meetings?.map((m) =>
            m._id === meetingId ? { ...m, myRsvp: status } : m
          ),
        };
      });
    } catch (err) {
      toast.error(err?.message || 'Failed to update RSVP');
    } finally {
      setRsvpSavingId(null);
    }
  };

  const selectedChild = children.find((c) => (c.id || c._id) === selectedChildId);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 w-full pb-12">

      
      {/* ────────────────── Header & Child Selector ────────────────── */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Greeting */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-emerald-400 bg-forest/10 dark:bg-dark-accent-soft px-2.5 py-0.5 rounded-full">
                Parent Portal
              </span>
              {selectedChild && (
                <span className="text-xs text-muted dark:text-dark-text-muted">
                  {selectedChild.academicYear}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-deep dark:text-dark-text mt-1">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Parent'}
            </h1>
            <p className="text-muted dark:text-dark-text-muted text-xs md:text-sm mt-0.5">
              {selectedChild
                ? `Overview for ${selectedChild.name} • Class ${selectedChild.class} - ${selectedChild.section}`
                : "Manage and track your child's academic progress"}
            </p>
          </div>

          {/* Child Switcher Dropdown */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {childrenLoading ? (
              <div className="h-10 w-48 bg-slate-100 dark:bg-dark-hover animate-pulse rounded-xl" />
            ) : children.length > 0 ? (
              <div className="relative">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-dark-card border border-border dark:border-dark-border rounded-xl px-3 py-1.5 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-forest dark:bg-emerald-500 text-white dark:text-gray-900 flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedChild?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="pr-2">
                    <p className="text-xs font-bold text-deep dark:text-dark-text leading-tight truncate max-w-[140px]">
                      {selectedChild?.name || 'Select Child'}
                    </p>
                    <p className="text-[11px] text-muted dark:text-dark-text-muted leading-tight">
                      {selectedChild ? `${selectedChild.class} - ${selectedChild.section}` : ''}
                    </p>
                  </div>
                  {children.length > 1 && (
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Switch child"
                    >
                      {children.map((child) => (
                        <option key={child.id || child._id} value={child.id || child._id}>
                          {child.name} — {child.class} {child.section}
                        </option>
                      ))}
                    </select>
                  )}
                  {children.length > 1 && <ChevronDown size={14} className="text-muted dark:text-dark-text-muted shrink-0" />}
                </div>
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedChildId && fetchChildDashboard(selectedChildId)}
              loading={dashboardLoading}
              title="Refresh child data"
            >
              <RefreshCw size={14} className={dashboardLoading ? 'animate-spin' : ''} />
            </Button>
          </div>

        </div>
      </div>

      {/* ────────────────── Zero Children State ────────────────── */}
      {!childrenLoading && children.length === 0 && (
        <Card className="p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Users size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-lg font-bold text-deep">No Linked Students Found</h2>
            <p className="text-sm text-muted">
              There are no active student profiles associated with your parent account.
            </p>
          </div>
          <div className="bg-slate-50 border border-border/80 rounded-xl p-4 max-w-lg mx-auto text-xs text-muted space-y-2">
            <p className="font-semibold text-deep">Need help connecting your children?</p>
            <p>
              Please contact your school administrator or admissions office with your student's admission number. Once linked, their academic records, attendance, timetable, and fees will appear here automatically.
            </p>
          </div>
        </Card>
      )}

      {/* ────────────────── Error State ────────────────── */}
      {dashboardError && (
        <Card className="p-8 text-center space-y-3 border-red-200 bg-red-50/50">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-900">Failed to load student data</h3>
          <p className="text-sm text-red-600 max-w-md mx-auto">{dashboardError}</p>
          <Button
            size="sm"
            onClick={() => selectedChildId && fetchChildDashboard(selectedChildId)}
            className="mt-2"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* ────────────────── Main Dashboard Content ────────────────── */}
      {selectedChildId && (
        <>
          {/* Row 1: KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Attendance */}
            <Card className="hover:shadow-md transition-shadow">
              {dashboardLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-100 rounded w-3/4"></div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <ClipboardList size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-deep">
                        {dashboardData?.attendance?.percentage ?? 0}%
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {dashboardData?.attendance?.present ?? 0}/{dashboardData?.attendance?.totalDays ?? 0} days
                      </span>
                    </div>
                    <p className="text-xs text-muted font-medium">Overall Attendance</p>
                  </div>
                </div>
              )}
            </Card>

            {/* 2. Fee Status */}
            <Card className="hover:shadow-md transition-shadow">
              {dashboardLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-100 rounded w-3/4"></div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl border ${
                    dashboardData?.fees?.balance === 0 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                    <DollarSign size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-deep">
                        ₹{dashboardData?.fees?.balance?.toLocaleString('en-IN') ?? 0}
                      </span>
                      <Badge color={dashboardData?.fees?.status === 'PAID' ? 'success' : dashboardData?.fees?.status === 'PARTIAL' ? 'warning' : 'danger'}>
                        {dashboardData?.fees?.status || 'PENDING'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted font-medium">
                      {dashboardData?.fees?.balance === 0 ? 'All fees cleared' : 'Pending Balance'}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* 3. Pending Homework */}
            <Card className="hover:shadow-md transition-shadow">
              {dashboardLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-100 rounded w-3/4"></div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <BookOpen size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-deep">
                        {dashboardData?.homework?.pendingCount ?? 0}
                      </span>
                      <span className="text-xs text-muted">
                        of {dashboardData?.homework?.items?.length ?? 0} active
                      </span>
                    </div>
                    <p className="text-xs text-muted font-medium">Pending Homework</p>
                  </div>
                </div>
              )}
            </Card>

            {/* 4. Recognition Points */}
            <Card className="hover:shadow-md transition-shadow">
              {dashboardLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-100 rounded w-3/4"></div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    <Trophy size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-deep">
                        +{dashboardData?.recognition?.totalPoints ?? 0}
                      </span>
                      <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-semibold">
                        {dashboardData?.recognition?.items?.length ?? 0} Badges
                      </span>
                    </div>
                    <p className="text-xs text-muted font-medium">Recognition Points</p>
                  </div>
                </div>
              )}
            </Card>

          </div>

          {/* Row 2: Today's Schedule & Upcoming Homework */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Today's Timetable (1 Column) */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-deep flex items-center gap-2">
                  <Clock size={18} className="text-forest" /> Today's Schedule
                </h2>
                <Link to="/timetable" className="text-xs font-semibold text-forest hover:underline">
                  Full week →
                </Link>
              </div>

              <Card className="!p-4 space-y-3 min-h-[280px]">
                {dashboardLoading ? (
                  <div className="space-y-2.5 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : !dashboardData?.timetable?.hasSchedule || dashboardData?.timetable?.periods?.length === 0 ? (
                  <div className="py-12 text-center text-muted space-y-2">
                    <Clock size={32} className="mx-auto opacity-30 text-forest" />
                    <p className="text-sm font-semibold text-deep">No Classes Today</p>
                    <p className="text-xs text-muted">No scheduled lectures for today or weekend break.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {dashboardData.timetable.periods.map((p, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                          p.isBreak
                            ? 'bg-slate-50 border-slate-200 text-slate-500 font-medium'
                            : 'bg-white border-border/80 hover:border-forest/40 hover:bg-forest/5 transition-colors'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                            p.isBreak ? 'bg-slate-200 text-slate-600' : 'bg-forest/10 text-forest'
                          }`}>
                            P{p.periodNo}
                          </span>
                          <div>
                            <p className="font-bold text-deep">{p.subjectName}</p>
                            {p.teacherName && (
                              <p className="text-[11px] text-muted">{p.teacherName}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-700">
                            {p.startTime || '—'}
                          </span>
                          {p.room && (
                            <p className="text-[10px] text-muted">Room: {p.room}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Upcoming Homework (2 Columns) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-deep flex items-center gap-2">
                  <BookOpen size={18} className="text-forest" /> Assigned Homework
                </h2>
                <span className="text-xs text-muted">
                  Class {selectedChild?.class} • Section {selectedChild?.section}
                </span>
              </div>

              <Card className="!p-4 min-h-[280px]">
                {dashboardLoading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : !dashboardData?.homework?.items || dashboardData.homework.items.length === 0 ? (
                  <div className="py-12 text-center text-muted space-y-2">
                    <CheckCircle2 size={32} className="mx-auto opacity-30 text-emerald-600" />
                    <p className="text-sm font-semibold text-deep">All Caught Up!</p>
                    <p className="text-xs text-muted">No pending homework assignments for this class.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dashboardData.homework.items.map((hw) => {
                      const dueInfo = getRelativeDue(hw.dueDate);
                      return (
                        <div
                          key={hw._id}
                          className="p-3 bg-slate-50/70 border border-border/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white hover:border-border transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-forest bg-forest/10 px-2 py-0.5 rounded-md">
                                {hw.subjectName}
                              </span>
                              <h3 className="text-sm font-bold text-deep">{hw.title}</h3>
                            </div>
                            <p className="text-xs text-muted line-clamp-1">
                              {hw.description || 'No additional instructions'}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-muted pt-0.5">
                              <span>By: {hw.teacherName}</span>
                              <span>•</span>
                              <span>Due: {formatDate(hw.dueDate)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <Badge color={dueInfo.color}>{dueInfo.label}</Badge>
                            <Badge color={
                              hw.submissionStatus === 'submitted' || hw.submissionStatus === 'graded' 
                                ? 'success' 
                                : hw.submissionStatus === 'overdue' 
                                ? 'danger' 
                                : 'warning'
                            }>
                              {hw.submissionStatus === 'graded' ? `Graded: ${hw.marks ?? ''}` : hw.submissionStatus}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

          </div>

          {/* Row 3: Academic Results & Fee Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Academic Results & Exams */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-deep flex items-center gap-2">
                  <GraduationCap size={18} className="text-forest" /> Academic Results & Exams
                </h2>
              </div>

              <Card className="!p-4 min-h-[260px] space-y-4">
                {dashboardLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Recent Exam Scores */}
                    {dashboardData?.exams?.recentResults?.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">Recent Exam Marks</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {dashboardData.exams.recentResults.map((r) => (
                            <div key={r._id} className="p-2.5 bg-slate-50 border border-border/80 rounded-xl space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-deep">{r.subjectName}</span>
                                <span className="text-xs font-extrabold text-forest">{r.marksObtained}/{r.maxMarks}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-muted">
                                <span className="truncate max-w-[110px]">{r.examName}</span>
                                <Badge size="sm" color={r.percentage >= 75 ? 'success' : r.percentage >= 50 ? 'warning' : 'danger'}>
                                  {r.grade ? `Grade ${r.grade}` : `${r.percentage}%`}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted text-center py-4">No published exam results yet for this session.</p>
                    )}

                    {/* Upcoming Exam Schedule */}
                    {dashboardData?.exams?.upcoming?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">Upcoming Exams</p>
                        <div className="space-y-1.5">
                          {dashboardData.exams.upcoming.map((e) => (
                            <div key={e._id} className="flex items-center justify-between p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-xs">
                              <span className="font-semibold text-blue-900">{e.name}</span>
                              <span className="text-blue-700 font-medium">{formatDate(e.startDate)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-deep flex items-center gap-2">
                  <DollarSign size={18} className="text-forest" /> Fee Breakdown & Receipts
                </h2>
              </div>

              <Card className="!p-4 min-h-[260px] space-y-4">
                {dashboardLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded-xl border border-border/80">
                      <div>
                        <p className="text-[11px] text-muted">Total Assigned</p>
                        <p className="text-sm font-extrabold text-deep">
                          ₹{dashboardData?.fees?.totalAssigned?.toLocaleString('en-IN') ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted">Paid So Far</p>
                        <p className="text-sm font-extrabold text-emerald-600">
                          ₹{dashboardData?.fees?.totalPaid?.toLocaleString('en-IN') ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted">Remaining Due</p>
                        <p className="text-sm font-extrabold text-amber-600">
                          ₹{dashboardData?.fees?.balance?.toLocaleString('en-IN') ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">Recent Transactions</p>
                      {dashboardData?.fees?.transactions?.length > 0 ? (
                        <div className="space-y-1.5">
                          {dashboardData.fees.transactions.map((t) => (
                            <div key={t._id} className="flex items-center justify-between p-2 bg-white border border-border rounded-lg text-xs">
                              <div>
                                <span className="font-semibold text-deep">Paid ₹{t.paidAmount?.toLocaleString('en-IN')}</span>
                                <p className="text-[10px] text-muted">{formatDate(t.paymentDate)} via {t.paymentMethod || 'Manual'}</p>
                              </div>
                              <Badge color={t.status === 'paid' ? 'success' : 'warning'}>{t.status}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted text-center py-2">No transaction history recorded yet.</p>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </div>

          </div>

          {/* Row 4: Parent Meetings & School Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Parent Meetings with RSVP */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-deep flex items-center gap-2">
                  <Users size={18} className="text-forest" /> Parent-Teacher Meetings
                </h2>
                <Link to="/parent-meetings" className="text-xs font-semibold text-forest hover:underline">
                  View all →
                </Link>
              </div>

              <Card className="!p-4 min-h-[220px]">
                {dashboardLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : !dashboardData?.meetings || dashboardData.meetings.length === 0 ? (
                  <div className="py-8 text-center text-muted space-y-1.5">
                    <Users size={28} className="mx-auto opacity-30 text-forest" />
                    <p className="text-xs font-semibold text-deep">No Upcoming Meetings</p>
                    <p className="text-[11px] text-muted">You are all set. No parent conferences are currently scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.meetings.map((m) => (
                      <div key={m._id} className="p-3 bg-slate-50 border border-border rounded-xl space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-deep text-xs sm:text-sm">{m.title}</h3>
                            <p className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                              <CalendarIcon size={11} /> {formatDate(m.date)} • {m.startTime} – {m.endTime}
                            </p>
                            {m.location && (
                              <p className="text-[11px] text-secondary flex items-center gap-1.5 mt-0.5">
                                <MapPin size={11} /> {m.location}
                              </p>
                            )}
                          </div>
                          {m.myRsvp && m.myRsvp !== 'PENDING' && (
                            <Badge color={RSVP_BADGE[m.myRsvp] || 'gray'}>{m.myRsvp}</Badge>
                          )}
                        </div>

                        {/* Interactive RSVP Action */}
                        <div className="pt-1 border-t border-border/50 flex items-center justify-between">
                          <span className="text-[11px] text-muted font-medium">Your RSVP:</span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant={m.myRsvp === 'GOING' ? 'primary' : 'outline'}
                              loading={rsvpSavingId === m._id}
                              onClick={() => handleRsvp(m._id, 'GOING')}
                              className="text-xs h-7 px-2.5"
                            >
                              <Check size={12} className="mr-1" /> Going
                            </Button>
                            <Button
                              size="sm"
                              variant={m.myRsvp === 'MAYBE' ? 'primary' : 'outline'}
                              loading={rsvpSavingId === m._id}
                              onClick={() => handleRsvp(m._id, 'MAYBE')}
                              className="text-xs h-7 px-2.5"
                            >
                              <Minus size={12} className="mr-1" /> Maybe
                            </Button>
                            <Button
                              size="sm"
                              variant={m.myRsvp === 'NOT_GOING' ? 'primary' : 'outline'}
                              loading={rsvpSavingId === m._id}
                              onClick={() => handleRsvp(m._id, 'NOT_GOING')}
                              className="text-xs h-7 px-2.5"
                            >
                              <X size={12} className="mr-1" /> Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* School Notices & Circulars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-deep flex items-center gap-2">
                  <Bell size={18} className="text-forest" /> School Notices & Announcements
                </h2>
                <Link to="/notices" className="text-xs font-semibold text-forest hover:underline">
                  Notice Board →
                </Link>
              </div>

              <Card className="!p-4 min-h-[220px]">
                {dashboardLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : !dashboardData?.notices || dashboardData.notices.length === 0 ? (
                  <div className="py-8 text-center text-muted space-y-1">
                    <Bell size={28} className="mx-auto opacity-30 text-forest" />
                    <p className="text-xs font-semibold text-deep">No Circulars Published</p>
                    <p className="text-[11px] text-muted">All clear. Check back later for announcements.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dashboardData.notices.map((n) => (
                      <div key={n._id} className="p-2.5 bg-slate-50 border border-border/80 rounded-xl space-y-1 hover:bg-white transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-deep line-clamp-1">{n.title}</h4>
                          <Badge size="sm" color={n.category === 'emergency' ? 'danger' : n.category === 'academic' ? 'info' : 'gray'}>
                            {n.category || 'General'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted line-clamp-1">{n.content}</p>
                        <p className="text-[10px] text-slate-400 text-right">{formatDate(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

          </div>

          {/* Row 5: School Events & Recognition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming School Events */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-deep flex items-center gap-2">
                  <CalendarIcon size={18} className="text-forest" /> Upcoming School Events
                </h2>
                <Link to="/events" className="text-xs font-semibold text-forest hover:underline">
                  School Calendar →
                </Link>
              </div>

              <Card className="!p-4 min-h-[200px]">
                {dashboardLoading ? (
                  <div className="space-y-2.5">
                    {[1, 2].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : !dashboardData?.events || dashboardData.events.length === 0 ? (
                  <div className="py-6 text-center text-muted">
                    <p className="text-xs text-muted">No upcoming school events scheduled.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dashboardData.events.map((e) => (
                      <div key={e._id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-border rounded-xl">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-deep">{e.title}</span>
                          <p className="text-[11px] text-muted flex items-center gap-1">
                            <Clock size={11} /> {formatDate(e.startDate)} {e.startTime ? `at ${e.startTime}` : ''}
                          </p>
                        </div>
                        <Badge size="sm" color="info">{e.type || 'Event'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Student Recognition & Badges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-deep flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" /> Recognition & Praise
                </h2>
              </div>

              <Card className="!p-4 min-h-[200px]">
                {dashboardLoading ? (
                  <div className="space-y-2.5">
                    {[1, 2].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : !dashboardData?.recognition?.items || dashboardData.recognition.items.length === 0 ? (
                  <div className="py-6 text-center text-muted">
                    <Award size={28} className="mx-auto opacity-30 text-purple-600 mb-1" />
                    <p className="text-xs text-muted">No recognition points recorded yet for this session.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {dashboardData.recognition.items.map((r) => (
                      <div key={r._id} className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Award size={13} className="text-purple-600" />
                            <span className="text-xs font-bold text-purple-900">{r.category?.toUpperCase() || 'PRAISE'}</span>
                          </div>
                          {r.note && <p className="text-[11px] text-slate-600 mt-0.5">{r.note}</p>}
                          <p className="text-[10px] text-muted">By {r.awardedBy} • {formatDate(r.createdAt)}</p>
                        </div>
                        <span className="text-sm font-extrabold text-purple-700">+{r.points}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

          </div>
        </>
      )}

    </div>
  );
}