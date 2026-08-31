import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Eye,
  Users,
  FileText,
  Check,
  X,
  Minus,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { parentMeetingApi } from '../../api/parentMeeting.api';

const STATUS_BADGE = { DRAFT: 'warning', PUBLISHED: 'primary', COMPLETED: 'success', CANCELLED: 'danger' };
const RSVP_BADGE = { PENDING: 'gray', GOING: 'success', MAYBE: 'warning', NOT_GOING: 'danger' };

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ParentMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload] = useState(0);

  const [details, setDetails] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [rsvpSaving, setRsvpSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const res = await parentMeetingApi.getAll({ limit: 50, sort: 'date' });
        if (active) setMeetings(res.data || []);
      } catch (err) {
        if (active) toast.error(err?.message || 'Unable to load parent meetings');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMeetings();
    return () => { active = false; };
  }, [reload]);

  const openDetails = async (meeting) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetails(null);
    try {
      const res = await parentMeetingApi.getById(meeting._id);
      setDetails(res.data || null);
    } catch (err) {
      toast.error(err?.message || 'Unable to load meeting details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRsvp = async (status, meetingId = details?._id) => {
    setRsvpSaving(true);
    try {
      await parentMeetingApi.rsvp(meetingId, status);
      setDetails((prev) => (prev && prev._id === meetingId ? { ...prev, myRsvp: status, permissions: { ...prev.permissions, canRsvp: false } } : prev));
      setMeetings((prev) => prev.map((m) => (m._id === meetingId ? { ...m, myRsvp: status } : m)));
      toast.success('Your response has been saved');
    } catch (err) {
      toast.error(err?.message || 'Unable to save your response');
    } finally {
      setRsvpSaving(false);
    }
  };

  const visibleNotes = details?.notes || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent Meetings"
        description="View and respond to upcoming parent-teacher meetings."
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <EmptyState title="No upcoming parent meetings" description="You will see meetings here when your child's school schedules one." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((m) => (
            <Card key={m._id} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-deep text-sm">{m.title}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDate(m.date)}</p>
                  <p className="text-xs text-secondary mt-1 flex items-center gap-1.5">
                    <Clock size={12} /> {m.startTime} – {m.endTime}
                  </p>
                  {m.location && (
                    <p className="text-xs text-secondary mt-1 flex items-center gap-1.5">
                      <MapPin size={12} /> {m.location}
                    </p>
                  )}
                </div>
                <Badge color={STATUS_BADGE[m.status] || 'gray'}>{m.status}</Badge>
              </div>

              <div className="mt-3">
                {m.myRsvp && m.myRsvp !== 'PENDING' && (
                  <Badge color={RSVP_BADGE[m.myRsvp] || 'gray'}>Your response: {m.myRsvp}</Badge>
                )}
              </div>

              {m.status === 'PUBLISHED' && (
                <div className="mt-3">
                  {!m.myRsvp || m.myRsvp === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" loading={rsvpSaving} onClick={() => handleRsvp('GOING', m._id)}>
                        <Check size={14} className="mr-1" /> Going
                      </Button>
                      <Button size="sm" variant="outline" loading={rsvpSaving} onClick={() => handleRsvp('MAYBE', m._id)}>
                        <Minus size={14} className="mr-1" /> Maybe
                      </Button>
                      <Button size="sm" variant="outline" loading={rsvpSaving} onClick={() => handleRsvp('NOT_GOING', m._id)}>
                        <X size={14} className="mr-1" /> Not Going
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge color={RSVP_BADGE[m.myRsvp] || 'gray'}>{m.myRsvp}</Badge>
                      <Button size="sm" variant="outline" onClick={() => openDetails(m)}>
                        <Eye size={14} className="mr-1" /> View Details
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {m.status !== 'PUBLISHED' && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => openDetails(m)}>
                    <Eye size={14} className="mr-1" /> View Details
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Meeting Details" size="lg">
        {detailsLoading || !details ? (
          <div className="space-y-3">
            <div className="h-6 bg-surface rounded animate-pulse w-1/2" />
            <div className="h-4 bg-surface rounded animate-pulse w-3/4" />
            <div className="h-24 bg-surface rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-deep">{details.title}</h3>
                <p className="text-sm text-muted">{details.typeLabel}</p>
              </div>
              <Badge color={STATUS_BADGE[details.status] || 'gray'}>{details.status}</Badge>
            </div>

            <div className="space-y-1.5 text-sm text-secondary">
              <p className="flex items-center gap-2"><CalendarIcon size={15} className="text-muted" /> {formatDate(details.date)}</p>
              <p className="flex items-center gap-2"><Clock size={15} className="text-muted" /> {details.startTime} – {details.endTime}</p>
              {details.location && <p className="flex items-center gap-2"><MapPin size={15} className="text-muted" /> {details.location}</p>}
            </div>

            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Your Children</p>
              <div className="space-y-2">
                {details.participants?.length === 0 && <p className="text-xs text-muted">No children associated.</p>}
                {details.participants?.map((p) => (
                  <div key={p.participantId} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-deep">{p.studentName}</p>
                      <p className="text-xs text-muted">{p.className}{p.sectionName ? ` ${p.sectionName}` : ''}</p>
                    </div>
                    <Badge color={RSVP_BADGE[p.rsvpStatus] || 'gray'}>{p.rsvpStatus}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {details.teachers?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Users size={13} /> Teachers
                </p>
                <div className="flex flex-wrap gap-2">
                  {details.teachers.map((t, i) => (
                    <Badge key={i} color="primary">{t.name}{t.className ? ` · ${t.className}${t.sectionName ? ` ${t.sectionName}` : ''}` : ''}</Badge>
                  ))}
                </div>
              </div>
            )}

            {details.instructions && (
              <div className="bg-info-light/50 border border-info/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-info-text mb-1 flex items-center gap-1.5"><FileText size={13} /> Instructions</p>
                <p className="text-xs text-secondary whitespace-pre-wrap">{details.instructions}</p>
              </div>
            )}

            {visibleNotes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Teacher Notes</p>
                <div className="space-y-2">
                  {visibleNotes.map((n) => (
                    <div key={n.noteId} className="border border-border rounded-lg p-3">
                      <p className="text-[11px] text-muted mb-1">{n.teacherName || n.createdByName} · {formatDate(n.createdAt)}</p>
                      <p className="text-xs text-deep whitespace-pre-wrap">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details.permissions?.canRsvp && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-secondary mb-2">Your Response</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" loading={rsvpSaving} onClick={() => handleRsvp('GOING')}><Check size={14} className="mr-1" /> Going</Button>
                  <Button size="sm" variant="outline" loading={rsvpSaving} onClick={() => handleRsvp('MAYBE')}><Minus size={14} className="mr-1" /> Maybe</Button>
                  <Button size="sm" variant="outline" loading={rsvpSaving} onClick={() => handleRsvp('NOT_GOING')}><X size={14} className="mr-1" /> Not Going</Button>
                </div>
              </div>
            )}
            {!details.permissions?.canRsvp && details.myRsvp && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-secondary mb-1">Your Response</p>
                <Badge color={RSVP_BADGE[details.myRsvp] || 'gray'}>{details.myRsvp}</Badge>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}