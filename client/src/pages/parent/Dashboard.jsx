import { ClipboardList, BookOpen, DollarSign, Trophy, Users, Calendar as CalendarIcon, Clock, Eye, Check, X, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { parentMeetingApi } from '../../api/parentMeeting.api';

const RSVP_BADGE = { PENDING: 'gray', GOING: 'success', MAYBE: 'warning', NOT_GOING: 'danger' };

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchMeetings = async () => {
      try {
        const res = await parentMeetingApi.getAll({ limit: 5, sort: 'date' });
        if (active) setMeetings((res.data || []).filter((m) => m.status === 'PUBLISHED'));
      } catch {
        // non-critical
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMeetings();
    return () => { active = false; };
  }, []);

  const handleRsvp = async (meetingId, status) => {
    setSaving(true);
    try {
      await parentMeetingApi.rsvp(meetingId, status);
      setMeetings((prev) => prev.map((m) => (m._id === meetingId ? { ...m, myRsvp: status } : m)));
      toast.success('Response saved');
    } catch (err) {
      toast.error(err?.message || 'Unable to save response');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-deep">Parent Dashboard</h1>
        <p className="text-muted text-sm mt-1">Your child's overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-forest"><ClipboardList size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep">-</p><p className="text-sm text-muted">Attendance</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-forest"><BookOpen size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep">-</p><p className="text-sm text-muted">Homework</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-warning"><DollarSign size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep">-</p><p className="text-sm text-muted">Fees</p></div></div></Card>
        <Card><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-info"><Trophy size={24} className="text-white"/></div><div><p className="text-2xl font-bold text-deep">-</p><p className="text-sm text-muted">Results</p></div></div></Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-deep flex items-center gap-2">
            <Users size={18} className="text-forest" /> Upcoming Parent Meetings
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/parent-meetings')}>View all</Button>
        </div>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 bg-white border border-border rounded-xl animate-pulse" />)}</div>
        ) : meetings.length === 0 ? (
          <Card><p className="text-sm text-muted text-center py-6">No upcoming parent meetings.</p></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => (
              <Card key={m._id} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-deep text-sm">{m.title}</p>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                      <CalendarIcon size={12} /> {formatDate(m.date)}
                    </p>
                    <p className="text-xs text-secondary mt-0.5 flex items-center gap-1.5">
                      <Clock size={12} /> {m.startTime} – {m.endTime}
                    </p>
                  </div>
                  {m.myRsvp && m.myRsvp !== 'PENDING' && (
                    <Badge color={RSVP_BADGE[m.myRsvp] || 'gray'}>{m.myRsvp}</Badge>
                  )}
                </div>
                <div className="mt-3">
                  {!m.myRsvp || m.myRsvp === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" loading={saving} onClick={() => handleRsvp(m._id, 'GOING')}><Check size={13} className="mr-1" /> Going</Button>
                      <Button size="sm" variant="outline" loading={saving} onClick={() => handleRsvp(m._id, 'MAYBE')}><Minus size={13} className="mr-1" /> Maybe</Button>
                      <Button size="sm" variant="outline" loading={saving} onClick={() => handleRsvp(m._id, 'NOT_GOING')}><X size={13} className="mr-1" /> Not Going</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => navigate('/parent-meetings')}>
                      <Eye size={13} className="mr-1" /> View Details
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}