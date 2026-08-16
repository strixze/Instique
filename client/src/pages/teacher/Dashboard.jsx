import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, ClipboardList, Calendar, Trophy, Clock,
  CheckCircle2, AlertCircle, ChevronRight, GraduationCap,
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

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${period}`;
}

const DAY_COLORS = ['border-l-forest', 'border-l-info', 'border-l-warning', 'border-l-danger', 'border-l-border'];

export default function TeacherDashboard() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    dashboardApi.getTeacher()
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

  const todayClasses = data?.todayClasses || [];
  const todayClassesCount = data?.todayClassesCount || 0;
  const pendingAttendance = data?.pendingAttendance || 0;
  const pendingHomework = data?.pendingHomework || 0;
  const upcomingExams = data?.upcomingExams || [];
  const syllabusProgress = data?.syllabusProgress || [];
  const pendingLeaveRequests = data?.pendingLeaveRequests || 0;

  const kpis = [
    {
      icon: Calendar,
      iconBg: 'bg-forest',
      value: todayClassesCount,
      label: "Today's Classes",
      sub: `${pendingAttendance} attendance pending`,
      subColor: pendingAttendance > 0 ? 'text-warning' : 'text-muted',
      onClick: () => navigate('/timetable'),
    },
    {
      icon: ClipboardList,
      iconBg: 'bg-forest',
      value: pendingAttendance,
      label: 'Pending Attendance',
      sub: 'Classes not yet marked',
      subColor: 'text-muted',
      onClick: () => navigate('/attendance'),
    },
    {
      icon: BookOpen,
      iconBg: 'bg-warning',
      value: pendingHomework,
      label: 'Homework Assigned',
      sub: 'Total homework given',
      subColor: 'text-muted',
      onClick: () => navigate('/homework'),
    },
    {
      icon: Trophy,
      iconBg: 'bg-info',
      value: upcomingExams.length,
      label: 'Upcoming Exams',
      sub: 'Scheduled exams',
      subColor: 'text-muted',
      onClick: () => navigate('/exams'),
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Teacher'} 👋
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">Here's your teaching overview for today.</p>
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

      {/* Today's Classes & Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Schedule */}
        <Card padding={false}>
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Today's Classes</h3>
            <button onClick={() => navigate('/timetable')} className="text-xs font-semibold text-forest hover:underline">
              Full Timetable
            </button>
          </div>
          <div className="p-4 space-y-3">
            {todayClasses.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No classes scheduled for today.</p>
            ) : (
              todayClasses.map((cls, i) => (
                <div key={i} className={`flex items-start justify-between border-l-2 ${DAY_COLORS[i % DAY_COLORS.length]} pl-3 py-0.5`}>
                  <div>
                    <span className="text-[11px] font-semibold text-muted block">
                      {formatTime(cls.startTime)}{cls.endTime ? ` – ${formatTime(cls.endTime)}` : ''}
                    </span>
                    <p className="text-xs font-bold text-deep leading-snug mt-0.5">{cls.subject}</p>
                    <p className="text-[11px] text-muted">
                      {cls.className}{cls.section ? ` · ${cls.section}` : ''}{cls.room ? ` · ${cls.room}` : ''}
                    </p>
                  </div>
                  <Badge color={cls.attendanceMarked ? 'success' : 'warning'}>
                    {cls.attendanceMarked ? 'Marked' : 'Pending'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Exams */}
        <Card padding={false}>
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Upcoming Exams</h3>
            <button onClick={() => navigate('/exams')} className="text-xs font-semibold text-forest hover:underline">
              View All
            </button>
          </div>
          <div className="p-4 space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No upcoming exams scheduled.</p>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam._id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-info-light text-info-text flex items-center justify-center shrink-0">
                      <GraduationCap size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-deep">{exam.name}</p>
                      <p className="text-[11px] text-muted">
                        {exam.startDate ? new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </p>
                    </div>
                  </div>
                  <Badge color="primary">{exam.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Syllabus Progress */}
      {syllabusProgress.length > 0 && (
        <Card padding={false}>
          <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Syllabus Progress</h3>
            <button onClick={() => navigate('/syllabus')} className="text-xs font-semibold text-forest hover:underline">
              View All
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {syllabusProgress.map((s, i) => {
              const pct = Math.round(s.totalCompletion || 0);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-deep">{s.subject?.name || 'Subject'}</span>
                    <span className="font-bold text-deep">{pct}%</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 75 ? 'bg-forest' : pct >= 50 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
