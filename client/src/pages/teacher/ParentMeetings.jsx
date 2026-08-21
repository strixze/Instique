import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar as CalendarIcon,
  Clock,
  Eye,
  MapPin,
  CheckCircle2,
  XCircle,
  StickyNote,
  Trash2,
  Users,
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
const ATTENDANCE_BADGE = { PENDING: 'gray', ATTENDED: 'success', ABSENT: 'danger', NOT_SCHEDULED: 'gray' };

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function TeacherMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload] = useState(0);

  const [details, setDetails] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [attUpdating, setAttUpdating] = useState(false);

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesMeeting, setNotesMeeting] = useState(null);
  const [notesStudent, setNotesStudent] = useState(null);
  const [notesList, setNotesList] = useState([]);
  const [noteForm, setNoteForm] = useState({ note: '', visibility: 'INTERNAL' });
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const res = await parentMeetingApi.getAll({ limit: 50, sort: '-date' });
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

  const updateAttendance = async (participantId, status) => {
    setAttUpdating(true);
    try {
      await parentMeetingApi.markAttendance(details._id, participantId, status);
      setDetails((prev) => ({
        ...prev,
        participants: (prev.participants || []).map((p) =>
          p.participantId === participantId ? { ...p, attendanceStatus: status } : p
        ),
      }));
      toast.success('Attendance updated');
    } catch (err) {
      toast.error(err?.message || 'Unable to update attendance');
    } finally {
      setAttUpdating(false);
    }
  };

  const openNotes = (student) => {
    setNotesMeeting(details);
    setNotesStudent(student);
    setNotesList((details.notes || []).filter((n) => n.studentId === student.studentId));
    setNoteForm({ note: '', visibility: 'INTERNAL' });
    setNotesOpen(true);
  };

  const saveNote = async () => {
    if (!noteForm.note.trim()) { toast.error('Note cannot be empty'); return; }
    setSavingNote(true);
    try {
      const res = await parentMeetingApi.addNote(notesMeeting._id, {
        studentId: notesStudent.studentId,
        note: noteForm.note,
        visibility: noteForm.visibility,
      });
      setNotesList((prev) => [...prev, res.data]);
      setNoteForm({ note: '', visibility: 'INTERNAL' });
      toast.success('Note saved');
    } catch (err) {
      toast.error(err?.message || 'Unable to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (note) => {
    try {
      await parentMeetingApi.deleteNote(notesMeeting._id, note.noteId);
      setNotesList((prev) => prev.filter((n) => n.noteId !== note.noteId));
      toast.success('Note deleted');
    } catch (err) {
      toast.error(err?.message || 'Unable to delete note');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent Meetings"
        description="View your assigned parent-teacher meetings and record outcomes."
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <EmptyState title="No assigned parent meetings" description="Meetings you are assigned to will appear here." />
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
                  <p className="text-xs text-secondary mt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={12} />
                      {(m.classes || []).map((c) => `${c.className}${c.sectionName ? ` ${c.sectionName}` : ''}`).join(', ')}
                    </span>
                  </p>
                </div>
                <Badge color={STATUS_BADGE[m.status] || 'gray'}>{m.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openDetails(m)}>
                  <Eye size={14} className="mr-1" /> View Meeting
                </Button>
                {m.status === 'PUBLISHED' && (
                  <Button size="sm" onClick={() => openDetails(m)}>
                    <CheckCircle2 size={14} className="mr-1" /> Attendance & Notes
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Meeting Details" size="xl">
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
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Assigned Classes</p>
              <div className="flex flex-wrap gap-2">
                {(details.classes || []).map((c, i) => (
                  <Badge key={i} color="primary">{c.className}{c.sectionName ? ` ${c.sectionName}` : ''}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Students</p>
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-surface/70">
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Student</th>
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Parent</th>
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">RSVP</th>
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Attendance</th>
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {details.participants?.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-muted">No students in your scope for this meeting.</td></tr>
                      )}
                      {details.participants?.map((p) => (
                        <tr key={p.participantId}>
                          <td className="px-3 py-2 text-xs text-deep">
                            {p.studentName} <span className="text-muted">· {p.className}{p.sectionName ? ` ${p.sectionName}` : ''}</span>
                          </td>
                          <td className="px-3 py-2 text-xs text-deep">{p.parentName}</td>
                          <td className="px-3 py-2"><Badge color={RSVP_BADGE[p.rsvpStatus] || 'gray'}>{p.rsvpStatus}</Badge></td>
                          <td className="px-3 py-2"><Badge color={ATTENDANCE_BADGE[p.attendanceStatus] || 'gray'}>{p.attendanceStatus}</Badge></td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openNotes(p)} className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-hover">
                                <StickyNote size={13} /> Notes
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {details.permissions?.canManageAttendance && details.participants?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Mark Attendance</p>
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border bg-surface/70">
                          <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Parent</th>
                          <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Student</th>
                          <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {details.participants.map((p) => (
                          <tr key={p.participantId}>
                            <td className="px-3 py-2 text-xs text-deep">{p.parentName}</td>
                            <td className="px-3 py-2 text-xs text-deep">{p.studentName}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <Button size="sm" variant="outline" disabled={attUpdating || p.attendanceStatus === 'ATTENDED'} onClick={() => updateAttendance(p.participantId, 'ATTENDED')}>
                                  <CheckCircle2 size={13} className="mr-1 text-success-text" /> Attended
                                </Button>
                                <Button size="sm" variant="outline" disabled={attUpdating || p.attendanceStatus === 'ABSENT'} onClick={() => updateAttendance(p.participantId, 'ABSENT')}>
                                  <XCircle size={13} className="mr-1 text-danger" /> Absent
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={notesOpen} onClose={() => setNotesOpen(false)} title="Meeting Notes" size="lg">
        {notesStudent && (
          <div className="space-y-4">
            <div className="bg-surface rounded-lg p-3">
              <p className="text-sm font-semibold text-deep">{notesStudent.studentName}</p>
              <p className="text-xs text-muted">{notesStudent.className}{notesStudent.sectionName ? ` ${notesStudent.sectionName}` : ''} · {notesStudent.parentName}</p>
            </div>

            <div className="space-y-2">
              {notesList.length === 0 && <p className="text-xs text-muted text-center py-4">No notes for this student yet.</p>}
              {notesList.map((n) => (
                <div key={n.noteId} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Badge color={n.visibility === 'PARENT_VISIBLE' ? 'success' : 'warning'}>{n.visibility === 'PARENT_VISIBLE' ? 'Parent Visible' : 'Internal'}</Badge>
                      <span className="text-[11px] text-muted">{n.teacherName || n.createdByName}</span>
                    </div>
                    <button onClick={() => deleteNote(n)} className="text-muted hover:text-danger transition-colors" title="Delete note">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-deep whitespace-pre-wrap">{n.note}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-secondary mb-2">Add Note</p>
              <textarea
                value={noteForm.note}
                onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs sm:text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 min-h-[80px]"
                placeholder="Academic performance, behaviour, areas to improve, action items..."
              />
              <div className="flex items-center justify-between gap-2 mt-2">
                <select
                  value={noteForm.visibility}
                  onChange={(e) => setNoteForm({ ...noteForm, visibility: e.target.value })}
                  className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 sm:w-56"
                >
                  <option value="INTERNAL">Internal (staff only)</option>
                  <option value="PARENT_VISIBLE">Parent Visible</option>
                </select>
                <Button loading={savingNote} onClick={saveNote}>Save Note</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}