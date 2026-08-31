import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, BookOpen, ClipboardList, Trophy, Users, CheckCircle2,
  AlertCircle, ChevronRight, Plus, MapPin, Award, FileText, ArrowRight,
  TrendingUp, RefreshCw, Sparkles, UserCheck, CalendarDays, ExternalLink,
  GraduationCap, Bell, AlertTriangle, FileEdit
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { dashboardApi } from '../../api/dashboard.api';
import { useUserStore } from '../../store/userStore';

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'subjects'

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getTeacher();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
      setError(err?.message || 'Unable to load teacher dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const greeting = getGreeting();
  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const teacher = data?.teacher;
  const summary = data?.summary || {};
  const todaysSchedule = data?.todaysSchedule || [];
  const classes = data?.classes || [];
  const subjects = data?.subjects || [];
  const homework = data?.homework || { summary: {}, recent: [] };
  const upcomingExams = data?.upcomingExams || [];
  const syllabusProgress = data?.syllabusProgress || [];
  const workload = data?.workload || {};
  const leave = data?.leave || {};
  const notices = data?.notices || [];
  const events = data?.events || [];
  const parentMeetings = data?.parentMeetings || [];


  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        {/* Header skeleton */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        </div>

        {/* KPI skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-white border border-border rounded-2xl p-4 animate-pulse space-y-2">
              <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>

        {/* Main section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white border border-border rounded-2xl p-6 animate-pulse"></div>
            <div className="h-64 bg-white border border-border rounded-2xl p-6 animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-white border border-border rounded-2xl p-6 animate-pulse"></div>
            <div className="h-64 bg-white border border-border rounded-2xl p-6 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-200 shadow-sm">
          <AlertCircle size={28} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-deep dark:text-dark-text">Unable to load dashboard</h2>
          <p className="text-sm text-muted dark:text-dark-text-muted max-w-md">{error}</p>
        </div>
        <Button onClick={fetchDashboard} className="mt-2 bg-forest hover:bg-forest/90 text-white">
          <RefreshCw size={16} className="mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Teacher Header & Quick Actions Banner ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 -mb-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {teacher?.employeeId && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                  ID: {teacher.employeeId}
                </span>
              )}
              {teacher?.department && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {teacher.department}
                </span>
              )}
              {teacher?.isClassTeacher && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles size={12} /> Class Teacher: {teacher.classTeacherOf} {teacher.classTeacherSection || ''}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, {teacher?.name || user?.name || 'Teacher'}! 👋
            </h1>

            <p className="text-slate-300 text-sm max-w-xl">
              {data?.school?.name ? `${data.school.name} — ` : ''}
              {summary.todaysClasses > 0
                ? `You have ${summary.todaysClasses} class${summary.todaysClasses === 1 ? '' : 'es'} scheduled today.`
                : 'No teaching periods scheduled for today.'}
              {summary.attendancePending > 0 ? (
                <span className="text-amber-300 font-semibold ml-1.5">
                  ({summary.attendancePending} attendance pending)
                </span>
              ) : (
                <span className="text-emerald-300 ml-1.5">All attendance up to date.</span>
              )}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              size="sm"
              onClick={() => navigate('/attendance')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-600/30 border-0"
            >
              <ClipboardList size={15} className="mr-1.5" /> Mark Attendance
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/homework')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/30 border-0"
            >
              <Plus size={15} className="mr-1.5" /> New Homework
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/marks-entry')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-600/30 border-0"
            >
              <FileEdit size={15} className="mr-1.5" /> Enter Marks
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/leaves')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Apply Leave
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Top Summary KPI Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Today's Classes */}
        <Card className="!p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted dark:text-dark-text-muted">Today's Classes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-deep dark:text-dark-text">{summary.todaysClasses ?? 0}</span>
            <span className="text-xs text-muted dark:text-dark-text-muted">periods</span>
          </div>
        </Card>

        {/* Students Taught */}
        <Card className="!p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted dark:text-dark-text-muted">Students Taught</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-deep dark:text-dark-text">{summary.studentsTaught ?? 0}</span>
            <span className="text-xs text-muted dark:text-dark-text-muted">enrolled</span>
          </div>
        </Card>

        {/* Pending Attendance */}
        <Card className={`!p-4 hover:shadow-md transition-shadow ${summary.attendancePending > 0 ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/10' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted dark:text-dark-text-muted">Attendance Pending</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${summary.attendancePending > 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary'}`}>
              <ClipboardList size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${summary.attendancePending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-deep dark:text-dark-text'}`}>
              {summary.attendancePending ?? 0}
            </span>
            <span className="text-xs text-muted dark:text-dark-text-muted">classes</span>
          </div>
        </Card>

        {/* Pending Homework */}
        <Card className="!p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted dark:text-dark-text-muted">Active Homework</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-deep dark:text-dark-text">{summary.homeworkPending ?? 0}</span>
            <span className="text-xs text-muted dark:text-dark-text-muted">assigned</span>
          </div>
        </Card>

        {/* Upcoming Exams */}
        <Card className="!p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted dark:text-dark-text-muted">Upcoming Exams</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Trophy size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-deep dark:text-dark-text">{summary.upcomingExams ?? 0}</span>
            <span className="text-xs text-muted dark:text-dark-text-muted">exams</span>
          </div>
        </Card>

        {/* Pending Marks */}
        <Card className={`!p-4 hover:shadow-md transition-shadow ${summary.marksPending > 0 ? 'border-red-300 dark:border-rose-500/30 bg-red-50/20 dark:bg-rose-500/10' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted dark:text-dark-text-muted">Marks Pending</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${summary.marksPending > 0 ? 'bg-red-100 dark:bg-rose-500/20 text-red-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary'}`}>
              <FileEdit size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${summary.marksPending > 0 ? 'text-red-600 dark:text-rose-400' : 'text-deep dark:text-dark-text'}`}>
              {summary.marksPending ?? 0}
            </span>
            <span className="text-xs text-muted dark:text-dark-text-muted">tasks</span>
          </div>
        </Card>
      </div>

      {/* ── 3. Main Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── LEFT 2 COLUMNS ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ── Today's Timetable Schedule ── */}
          <Card className="!p-0 overflow-hidden border border-border dark:border-dark-border shadow-sm">
            <div className="p-5 border-b border-border dark:border-dark-border bg-slate-50/60 dark:bg-dark-elevated flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-deep dark:text-dark-text flex items-center gap-2">
                  <Clock size={18} className="text-forest dark:text-emerald-400" /> Today's Lecture Schedule
                </h2>
                <p className="text-xs text-muted dark:text-dark-text-muted">
                  Chronological schedule for {todayDateFormatted}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/timetable')}
                className="text-xs"
              >
                Weekly Timetable <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>

            {todaysSchedule.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-dark-hover text-slate-400 dark:text-dark-text-muted flex items-center justify-center mx-auto">
                  <CalendarDays size={24} />
                </div>
                <p className="text-sm font-semibold text-deep dark:text-dark-text">No classes scheduled today</p>
                <p className="text-xs text-muted dark:text-dark-text-muted max-w-sm mx-auto">
                  You have no teaching periods assigned for today. You can use this time for lesson preparation or grading.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border dark:divide-dark-border">
                {todaysSchedule.map((lecture, idx) => {
                  const isBreak = lecture.isBreak || lecture.isLunch;
                  return (
                    <div
                      key={idx}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isBreak ? 'bg-slate-50/80 dark:bg-dark-elevated text-muted dark:text-dark-text-muted' : 'hover:bg-slate-50/50 dark:hover:bg-dark-hover'
                      }`}
                    >
                      {/* Left: Period & Time */}
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                          isBreak
                            ? 'bg-slate-200 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary'
                            : 'bg-forest/10 dark:bg-dark-accent-soft text-forest dark:text-emerald-400 border border-forest/20 dark:border-emerald-500/20'
                        }`}>
                          <span>P{lecture.periodNo}</span>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-deep dark:text-dark-text">
                              {isBreak ? (lecture.label || 'Break / Recess') : (lecture.subject?.name || 'Lecture')}
                            </span>
                            {lecture.subject?.code && !isBreak && (
                              <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary font-mono">
                                {lecture.subject.code}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted dark:text-dark-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="opacity-70" />
                              {lecture.startTime && lecture.endTime ? `${lecture.startTime} – ${lecture.endTime}` : 'Time TBD'}
                            </span>
                            {!isBreak && lecture.schoolClass && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-slate-700 dark:text-dark-text-secondary">
                                  {lecture.schoolClass?.name}{lecture.section?.name ? ` - ${lecture.section.name}` : ''}
                                </span>
                              </>
                            )}
                            {!isBreak && lecture.room && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} className="opacity-70" /> Room {lecture.room}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Attendance Action / Status */}
                      {!isBreak && (
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {lecture.attendanceMarked ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" /> Attendance Marked
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => navigate('/attendance', {
                                state: {
                                  classId: lecture.schoolClass?._id,
                                  sectionId: lecture.section?._id,
                                  subjectId: lecture.subject?._id,
                                  periodNo: lecture.periodNo
                                }
                              })}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 shadow-sm"
                            >
                              <ClipboardList size={13} className="mr-1.5" /> Mark Now
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── My Classes & Assigned Subjects Tabbed Card ── */}
          <Card className="!p-0 overflow-hidden border border-border dark:border-dark-border shadow-sm">
            <div className="p-5 border-b border-border dark:border-dark-border bg-slate-50/60 dark:bg-dark-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-deep dark:text-dark-text flex items-center gap-2">
                  <GraduationCap size={18} className="text-forest dark:text-emerald-400" /> Teaching Assignments
                </h2>
                <p className="text-xs text-muted dark:text-dark-text-muted">
                  Classes, sections, and subjects assigned to your profile
                </p>
              </div>

              {/* Tab Selector */}
              <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-dark-hover text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'classes'
                      ? 'bg-white dark:bg-dark-card text-forest dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text'
                  }`}
                >
                  My Classes ({classes.length})
                </button>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'subjects'
                      ? 'bg-white dark:bg-dark-card text-forest dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text'
                  }`}
                >
                  My Subjects ({subjects.length})
                </button>
              </div>
            </div>

            <div className="p-5">
              {activeTab === 'classes' ? (
                classes.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">No classes currently assigned.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {classes.map((cls, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-4 rounded-xl border border-border bg-white hover:border-forest/40 hover:shadow-sm transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-sm text-deep">
                              {cls.className}{cls.sectionName ? ` — Section ${cls.sectionName}` : ''}
                            </h3>
                            {cls.room && (
                              <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                <MapPin size={11} /> Room {cls.room}
                              </p>
                            )}
                          </div>
                          {cls.isClassTeacher && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              Class Teacher
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/60">
                          <span className="font-medium flex items-center gap-1">
                            <Users size={12} className="text-forest" /> {cls.studentCount} Students
                          </span>
                          <span className="text-secondary font-medium">
                            {cls.subjects?.length ? `${cls.subjects.length} subject${cls.subjects.length > 1 ? 's' : ''}` : 'No subject'}
                          </span>
                        </div>

                        {cls.subjects?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {cls.subjects.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                              >
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                subjects.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">No subjects currently assigned.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {subjects.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-4 rounded-xl border border-border bg-white hover:border-forest/40 hover:shadow-sm transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-deep">{sub.name}</h3>
                          {sub.code && (
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {sub.code}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>Weekly periods: <strong className="text-deep">{sub.weeklyPeriods || '—'}</strong></span>
                          <span className="capitalize text-secondary">{sub.category || 'academic'}</span>
                        </div>

                        {sub.assignedClasses?.length > 0 && (
                          <div className="text-xs text-slate-600 pt-1 border-t border-border/60">
                            <span className="text-muted">Classes: </span>
                            <span className="font-medium">{sub.assignedClasses.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </Card>

          {/* ── Homework & Upcoming Exams (Dual Section) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Homework Section */}
            <Card className="!p-5 space-y-3.5 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                  <BookOpen size={16} className="text-forest" /> Assigned Homework
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/homework')} className="text-xs">
                  View All <ChevronRight size={13} />
                </Button>
              </div>

              {homework.recent?.length === 0 ? (
                <div className="text-center py-6 text-muted text-xs">
                  No homework assignments created yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {homework.recent.slice(0, 4).map((hw) => (
                    <div
                      key={hw._id}
                      className="p-3 rounded-xl border border-border bg-slate-50/40 hover:bg-slate-50 transition-all text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-deep truncate">{hw.title}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          hw.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {hw.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted text-[11px]">
                        <span>{hw.className}{hw.sectionName ? ` (${hw.sectionName})` : ''} • {hw.subjectName}</span>
                        <span>Due: {formatDate(hw.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Upcoming Exams */}
            <Card className="!p-5 space-y-3.5 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                  <Trophy size={16} className="text-purple-600" /> Upcoming Exams
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/exams')} className="text-xs">
                  View All <ChevronRight size={13} />
                </Button>
              </div>

              {upcomingExams.length === 0 ? (
                <div className="text-center py-6 text-muted text-xs">
                  No upcoming exams scheduled.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingExams.slice(0, 4).map((ex) => (
                    <div
                      key={ex._id}
                      className="p-3 rounded-xl border border-border bg-purple-50/20 hover:bg-purple-50/40 transition-all text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-deep truncate">{ex.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0">
                          {ex.type?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted text-[11px]">
                        <span>Class: {ex.className || 'All'}</span>
                        <span>Starts: {formatDate(ex.startDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Syllabus Progress Section ── */}
          <Card className="!p-5 space-y-3.5 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                <TrendingUp size={16} className="text-forest" /> Curriculum / Syllabus Progress
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/academic')} className="text-xs">
                Manage Syllabus <ChevronRight size={13} />
              </Button>
            </div>

            {syllabusProgress.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No syllabus progress recorded for your subjects.</p>
            ) : (
              <div className="space-y-3">
                {syllabusProgress.slice(0, 4).map((syl) => (
                  <div key={syl._id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-deep">
                      <span>{syl.subjectName} ({syl.className})</span>
                      <span className="text-forest font-bold">{syl.totalCompletion || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, syl.totalCompletion || 0))}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{syl.completedChapters} of {syl.totalChapters} chapters completed</span>
                      {syl.inProgressChapters > 0 && <span>{syl.inProgressChapters} in progress</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

        {/* ── RIGHT COLUMN (1 COL) ── */}
        <div className="space-y-6">

          {/* ── Teaching Workload Gauge ── */}
          <Card className="!p-5 space-y-4 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                <TrendingUp size={16} className="text-forest" /> Weekly Workload
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {workload.weeklyUtilization || 0}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    (workload.weeklyUtilization || 0) > 90 ? 'bg-amber-500' : 'bg-forest'
                  }`}
                  style={{ width: `${Math.min(100, workload.weeklyUtilization || 0)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{workload.weeklyPeriods || 0} periods scheduled</span>
                <span>Max limit: {workload.weeklyLimit || 30}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <span className="block text-[11px] text-muted">Periods Today</span>
                <span className="text-base font-bold text-deep">{workload.dailyPeriodsToday || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <span className="block text-[11px] text-muted">Free Periods</span>
                <span className="text-base font-bold text-deep">{workload.freePeriodsToday || 0}</span>
              </div>
            </div>

            {/* Mini weekly distribution */}
            {workload.dailyDistribution?.length > 0 && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-[11px] font-semibold text-muted block mb-2">Daily Lecture Distribution</span>
                <div className="grid grid-cols-6 gap-1 text-center">
                  {workload.dailyDistribution.map((d, i) => (
                    <div key={i} className="p-1 rounded bg-slate-50">
                      <span className="text-[10px] text-muted block font-medium">{d.day}</span>
                      <span className="text-xs font-bold text-deep">{d.periods}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ── Parent Meetings ── */}
          <Card className="!p-5 space-y-3.5 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                <Users size={16} className="text-forest" /> Parent Meetings
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/parent-meetings')} className="text-xs">
                View All <ChevronRight size={13} />
              </Button>
            </div>

            {parentMeetings.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No parent meetings assigned.</p>
            ) : (
              <div className="space-y-2.5">
                {parentMeetings.slice(0, 3).map((m) => (
                  <div
                    key={m._id}
                    className="p-3 rounded-xl border border-border bg-slate-50/50 hover:bg-slate-50 transition-all text-xs space-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-deep">{m.title}</span>
                      {m.className && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {m.className}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <span>{formatDate(m.date)}</span>
                      <span>•</span>
                      <span>{m.startTime} – {m.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Upcoming School Events ── */}
          <Card className="!p-5 space-y-3.5 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                <CalendarDays size={16} className="text-forest" /> Upcoming Events
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/events')} className="text-xs">
                View All <ChevronRight size={13} />
              </Button>
            </div>

            {events.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No upcoming events scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {events.slice(0, 3).map((ev) => (
                  <div
                    key={ev._id}
                    className="p-3 rounded-xl border border-border bg-slate-50/50 hover:bg-slate-50 transition-all text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-deep truncate">{ev.title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 capitalize">
                        {ev.type || 'Event'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{formatDate(ev.startDate)}</span>
                      {ev.location && <span>{ev.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Staff Notices ── */}
          <Card className="!p-5 space-y-3.5 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                <Bell size={16} className="text-amber-600" /> Notice Board
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notices')} className="text-xs">
                All Notices <ChevronRight size={13} />
              </Button>
            </div>

            {notices.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No active notices.</p>
            ) : (
              <div className="space-y-2.5">
                {notices.slice(0, 3).map((notice) => (
                  <div
                    key={notice._id}
                    className="p-3 rounded-xl border border-border bg-slate-50/50 hover:bg-slate-50 transition-all text-xs space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-deep line-clamp-1">{notice.title}</span>
                      {notice.isPinned && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                          PINNED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted line-clamp-2">{notice.content}</p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">{formatDate(notice.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Leave Status ── */}
          <Card className="!p-5 space-y-3 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-deep flex items-center gap-2">
                <FileText size={16} className="text-forest" /> Leave Requests
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/leaves')} className="text-xs">
                Apply Leave <ChevronRight size={13} />
              </Button>
            </div>

            {leave.pendingCount > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>You have <strong>{leave.pendingCount}</strong> pending leave application(s).</span>
              </div>
            ) : leave.upcoming ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <span className="block font-semibold">Upcoming Approved Leave:</span>
                <span className="text-[11px] text-emerald-800">
                  {formatDate(leave.upcoming.startDate)} – {formatDate(leave.upcoming.endDate)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted text-center py-2">No pending or upcoming leave requests.</p>
            )}
          </Card>

        </div>

      </div>
    </div>
  );
}