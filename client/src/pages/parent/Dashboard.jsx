import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, BookOpen, DollarSign, Trophy, Users, Calendar as CalendarIcon, Clock, MapPin, ChevronRight, Check } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { meetingApi } from '../../api/meeting.api';
import { useUserStore } from '../../store/userStore';

export default function ParentDashboard() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);

  useEffect(() => {
    meetingApi.getAll({ limit: 3, status: 'upcoming' })
      .then((res) => setUpcomingMeetings(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">
          Parent Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">
          Welcome back, {user?.name || 'Parent'} 👋 Here is your child's school overview.
        </p>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-border rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-forest shrink-0">
              <ClipboardList size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-deep">Present</p>
              <p className="text-xs text-muted">Attendance Status</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-forest shrink-0">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-deep">Active</p>
              <p className="text-xs text-muted">Homework Assigned</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500 shrink-0">
              <DollarSign size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-deep">Up-to-date</p>
              <p className="text-xs text-muted">Fee Status</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600 shrink-0">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-deep">{upcomingMeetings.length}</p>
              <p className="text-xs text-muted">Upcoming PTMs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Upcoming Parent Meetings Widget ── */}
      <Card padding={false} className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-forest" />
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">Upcoming Parent Meetings</h3>
          </div>
          <button
            onClick={() => navigate('/parent-meetings')}
            className="text-xs font-bold text-forest hover:underline flex items-center gap-1"
          >
            View All Meetings <ChevronRight size={14} />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="py-8 text-center text-muted">
              <CalendarIcon size={32} className="mx-auto mb-2 opacity-50 text-muted" />
              <p className="text-xs font-bold text-deep">No upcoming parent meetings</p>
              <p className="text-[11px] text-muted mt-0.5">You will be notified when a new PTM is scheduled.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {upcomingMeetings.map((m) => {
                const formattedDate = new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const classesText = m.targetClasses?.map((c) => c.name).join(', ') || 'Grade Class';

                return (
                  <div key={m._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface/50 transition-colors rounded-xl px-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-deep text-sm hover:text-forest transition-colors cursor-pointer" onClick={() => navigate('/parent-meetings')}>
                          {m.title}
                        </span>
                        <Badge color="success">{classesText}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                        <span className="flex items-center gap-1"><CalendarIcon size={13} className="text-forest" /> {formattedDate}</span>
                        <span className="flex items-center gap-1"><Clock size={13} className="text-forest" /> {m.startTime} – {m.endTime}</span>
                        {m.location && <span className="flex items-center gap-1"><MapPin size={13} className="text-forest" /> {m.location}</span>}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => navigate('/parent-meetings')}
                      className="text-xs py-1.5 px-3 bg-forest text-white font-bold shrink-0 self-start sm:self-auto"
                    >
                      View & Confirm RSVP
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
