import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Calendar as CalendarIcon, Clock, MapPin, CheckCircle2,
  AlertCircle, ChevronRight, FileText, Check, X, HelpCircle, Eye,
  Sparkles, BookOpen, UserCheck, MessageSquare, Download
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { meetingApi } from '../../api/meeting.api';
import { useUserStore } from '../../store/userStore';

export default function ParentMeetingsView() {
  const user = useUserStore((s) => s.user);
  const isTeacher = user?.role === 'teacher';
  const isParent = user?.role === 'parent';

  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [activeMeetingDetail, setActiveMeetingDetail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' | 'attendance' | 'notes'
  const [rsvpSaving, setRsvpSaving] = useState(false);

  // Load Meetings
  const fetchMeetings = () => {
    setLoading(true);
    meetingApi.getAll({ limit: 50 })
      .then((res) => setMeetings(res.data || []))
      .catch((e) => toast.error(e?.message || 'Failed to load parent meetings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Open Details Modal
  const openDetailModal = async (meetingId) => {
    try {
      setDetailModalOpen(true);
      const res = await meetingApi.getById(meetingId);
      setActiveMeetingDetail(res.data);
      setDetailTab('overview');
    } catch (e) {
      toast.error(e?.message || 'Failed to load meeting details');
    }
  };

  // RSVP submission for parents
  const handleRSVP = async (meetingId, response) => {
    setRsvpSaving(true);
    try {
      await meetingApi.rsvp(meetingId, { response });
      toast.success(`RSVP updated: ${response.replace('_', ' ').toUpperCase()}`);
      const res = await meetingApi.getById(meetingId);
      setActiveMeetingDetail(res.data);
      fetchMeetings();
    } catch (e) {
      toast.error(e?.message || 'Failed to submit RSVP');
    } finally {
      setRsvpSaving(false);
    }
  };

  // Mark Attendance for Teachers
  const handleUpdateAttendanceStatus = async (parentId, studentId, status) => {
    if (!activeMeetingDetail) return;
    try {
      await meetingApi.markAttendance(activeMeetingDetail._id, { parentId, studentId, status });
      toast.success('Attendance updated');
      const res = await meetingApi.getById(activeMeetingDetail._id);
      setActiveMeetingDetail(res.data);
    } catch (e) {
      toast.error(e?.message || 'Failed to update attendance');
    }
  };

  // Note State for Teachers
  const [noteForm, setNoteForm] = useState({
    studentId: '',
    academicNotes: '',
    behaviourNotes: '',
    improvementNotes: '',
    actionItems: '',
    note: '',
    visibility: 'parent_visible',
  });

  const handleSelectStudentForNote = (studentId) => {
    const existing = (activeMeetingDetail?.notes || []).find(
      (n) => n.studentId?._id === studentId || n.studentId === studentId
    );
    if (existing) {
      setNoteForm({
        studentId,
        academicNotes: existing.academicNotes || '',
        behaviourNotes: existing.behaviourNotes || '',
        improvementNotes: existing.improvementNotes || '',
        actionItems: existing.actionItems || '',
        note: existing.note || '',
        visibility: existing.visibility || 'parent_visible',
      });
    } else {
      setNoteForm({
        studentId,
        academicNotes: '',
        behaviourNotes: '',
        improvementNotes: '',
        actionItems: '',
        note: '',
        visibility: 'parent_visible',
      });
    }
  };

  const handleSaveNoteSubmit = async () => {
    if (!noteForm.studentId) return;
    try {
      await meetingApi.saveNotes(activeMeetingDetail._id, noteForm);
      toast.success('Notes saved successfully');
      const res = await meetingApi.getById(activeMeetingDetail._id);
      setActiveMeetingDetail(res.data);
    } catch (e) {
      toast.error(e?.message || 'Failed to save notes');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight flex items-center gap-2">
          <Users className="text-forest" size={24} />
          {isParent ? 'Parent Meetings & PTM Schedule' : 'Assigned Parent Meetings'}
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-0.5">
          {isParent
            ? 'View scheduled meetings with school teachers and confirm your participation.'
            : 'Manage parent attendance and record meeting discussion notes for your assigned classes.'}
        </p>
      </div>

      {/* Main Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="p-5 bg-white border border-border rounded-xl space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))
        ) : meetings.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-border rounded-xl p-8">
            <Users size={40} className="mx-auto text-muted mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-deep">No parent meetings scheduled</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {isParent
                ? 'There are currently no upcoming parent meetings for your children.'
                : 'You have no parent meetings assigned for your classes at this time.'}
            </p>
          </div>
        ) : (
          meetings.map((m) => {
            const dateObj = new Date(m.date);
            const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const classesText = m.targetClasses?.map((c) => c.name).join(', ') || 'Target Classes';

            // Find existing RSVP if parent
            const myRsvp = isParent ? (m.rsvps || []).find((r) => r.parentId?._id === user?.profileId || r.parentId === user?.profileId) : null;

            return (
              <Card key={m._id} className="p-5 bg-white border border-border rounded-xl flex flex-col justify-between hover:border-forest/40 transition-all shadow-2xs">
                <div className="space-y-3">
                  {/* Top Badge & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-sage text-forest rounded-full">
                      {m.type ? m.type.replace('_', ' ').toUpperCase() : 'PTM'}
                    </span>
                    <Badge color={m.status === 'published' ? 'success' : m.status === 'completed' ? 'primary' : 'gray'}>
                      {m.status}
                    </Badge>
                  </div>

                  {/* Title & Date */}
                  <div>
                    <h3 className="text-base font-bold text-deep hover:text-forest transition-colors cursor-pointer" onClick={() => openDetailModal(m._id)}>
                      {m.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted mt-1">
                      <CalendarIcon size={14} className="text-forest shrink-0" />
                      <span>{formattedDate} ({m.startTime} – {m.endTime})</span>
                    </div>
                  </div>

                  {/* Target Classes & Location */}
                  <div className="space-y-1 text-xs text-secondary pt-1 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-muted" />
                      <span>Classes: <strong>{classesText}</strong></span>
                    </div>
                    {m.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-muted" />
                        <span>Location: <strong>{m.location}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Parent RSVP quick status */}
                  {isParent && (
                    <div className="p-2.5 bg-surface/60 rounded-lg text-xs flex items-center justify-between">
                      <span className="text-muted font-medium">Your Response:</span>
                      <span className={`font-bold capitalize ${
                        myRsvp?.response === 'going' ? 'text-forest' : myRsvp?.response === 'not_going' ? 'text-danger' : 'text-amber-600'
                      }`}>
                        {myRsvp?.response ? myRsvp.response.replace('_', ' ') : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDetailModal(m._id)}
                    className="w-full text-xs py-2 flex items-center justify-center gap-1.5 border-forest text-forest hover:bg-sage"
                  >
                    <Eye size={14} /> View Details & {isParent ? 'RSVP' : 'Manage'}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {detailModalOpen && activeMeetingDetail && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={activeMeetingDetail.title}
          size="lg"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Header Banner */}
            <div className="p-4 bg-surface/50 border border-border rounded-xl space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-bold text-deep">{activeMeetingDetail.title}</h3>
                <Badge color={activeMeetingDetail.status === 'published' ? 'success' : 'gray'}>
                  {activeMeetingDetail.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-secondary flex-wrap">
                <span className="flex items-center gap-1"><CalendarIcon size={13} className="text-forest" /> {new Date(activeMeetingDetail.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock size={13} className="text-forest" /> {activeMeetingDetail.startTime} – {activeMeetingDetail.endTime}</span>
                <span className="flex items-center gap-1"><MapPin size={13} className="text-forest" /> {activeMeetingDetail.location || 'School Campus'}</span>
              </div>
            </div>

            {/* Parent RSVP Selector Section */}
            {isParent && (
              <div className="p-4 border border-forest/30 bg-emerald-50/40 rounded-xl space-y-2">
                <span className="text-xs font-bold text-forest uppercase tracking-wider block">Confirm Your Attendance (RSVP)</span>
                <p className="text-xs text-secondary">Will you be attending this Parent-Teacher Meeting?</p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    disabled={rsvpSaving}
                    onClick={() => handleRSVP(activeMeetingDetail._id, 'going')}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-forest text-white hover:bg-forest/90 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Going
                  </button>
                  <button
                    disabled={rsvpSaving}
                    onClick={() => handleRSVP(activeMeetingDetail._id, 'not_going')}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X size={14} /> Not Going
                  </button>
                  <button
                    disabled={rsvpSaving}
                    onClick={() => handleRSVP(activeMeetingDetail._id, 'maybe')}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <HelpCircle size={14} /> Maybe
                  </button>
                </div>
              </div>
            )}

            {/* Tabs for Teacher & Parent */}
            <div className="flex items-center gap-2 border-b border-border pb-1">
              {[
                { key: 'overview', label: 'Meeting Overview' },
                ...(isTeacher ? [
                  { key: 'attendance', label: `Parent Attendance (${activeMeetingDetail.attendance?.length || 0})` },
                  { key: 'notes', label: `Student Discussion Notes (${activeMeetingDetail.notes?.length || 0})` },
                ] : [
                  { key: 'notes', label: `Teacher Feedback & Notes (${activeMeetingDetail.notes?.length || 0})` },
                ])
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    detailTab === tab.key
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-white border border-border text-secondary hover:bg-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {detailTab === 'overview' && (
              <div className="space-y-3 text-xs text-deep">
                {activeMeetingDetail.instructions && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                    <strong className="block mb-0.5 font-bold">Important Instructions:</strong>
                    {activeMeetingDetail.instructions}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border border-border rounded-xl">
                    <span className="text-muted font-semibold text-[11px] block">Target Classes</span>
                    <p className="font-bold text-deep mt-0.5">
                      {activeMeetingDetail.targetClasses?.map((c) => c.name).join(', ') || 'All Classes'}
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-xl">
                    <span className="text-muted font-semibold text-[11px] block">Participating Teachers</span>
                    <p className="font-bold text-deep mt-0.5">
                      {activeMeetingDetail.assignedTeachers?.map((t) => `${t.firstName} ${t.lastName}`).join(', ') || 'Class Teachers'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ATTENDANCE (Teacher Mode) */}
            {detailTab === 'attendance' && isTeacher && (
              <div className="space-y-3 text-xs">
                <p className="text-muted text-[11px]">Mark attendance for parents of your assigned class students:</p>
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {activeMeetingDetail.attendance?.map((att) => {
                    const parentName = att.parentId ? `${att.parentId.firstName} ${att.parentId.lastName}` : 'Parent';
                    const studentName = att.studentId ? `${att.studentId.firstName} ${att.studentId.lastName}` : 'Student';
                    const className = att.studentId?.currentClass?.name || 'Class';

                    return (
                      <div key={att._id} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-deep">{parentName}</div>
                          <div className="text-[11px] text-muted">Child: {studentName} ({className})</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateAttendanceStatus(att.parentId?._id || att.parentId, att.studentId?._id || att.studentId, 'attended')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              att.status === 'attended' ? 'bg-forest text-white' : 'bg-surface border border-border text-secondary'
                            }`}
                          >
                            Attended
                          </button>
                          <button
                            onClick={() => handleUpdateAttendanceStatus(att.parentId?._id || att.parentId, att.studentId?._id || att.studentId, 'absent')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              att.status === 'absent' ? 'bg-danger text-white' : 'bg-surface border border-border text-secondary'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: NOTES */}
            {detailTab === 'notes' && (
              <div className="space-y-4 text-xs">
                {isTeacher && (
                  <div className="p-4 border border-border rounded-xl bg-surface/30 space-y-3">
                    <span className="text-xs font-bold text-deep uppercase tracking-wider block">Record Student Meeting Notes</span>
                    <select
                      value={noteForm.studentId}
                      onChange={(e) => handleSelectStudentForNote(e.target.value)}
                      className="w-full text-xs bg-white border border-border rounded-lg px-3 py-1.5 text-deep font-medium cursor-pointer"
                    >
                      <option value="">-- Choose Student --</option>
                      {activeMeetingDetail.attendance?.map((att) => {
                        const s = att.studentId;
                        if (!s) return null;
                        return <option key={s._id || s} value={s._id || s}>{s.firstName} {s.lastName}</option>;
                      })}
                    </select>

                    {noteForm.studentId && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <input
                          type="text"
                          value={noteForm.academicNotes}
                          onChange={(e) => setNoteForm({ ...noteForm, academicNotes: e.target.value })}
                          placeholder="Academic Performance (e.g. Good progress in Math)"
                          className="w-full text-xs bg-white border border-border rounded-lg p-2 text-deep"
                        />
                        <input
                          type="text"
                          value={noteForm.behaviourNotes}
                          onChange={(e) => setNoteForm({ ...noteForm, behaviourNotes: e.target.value })}
                          placeholder="Behaviour / Participation"
                          className="w-full text-xs bg-white border border-border rounded-lg p-2 text-deep"
                        />
                        <input
                          type="text"
                          value={noteForm.improvementNotes}
                          onChange={(e) => setNoteForm({ ...noteForm, improvementNotes: e.target.value })}
                          placeholder="Areas to Improve"
                          className="w-full text-xs bg-white border border-border rounded-lg p-2 text-deep"
                        />
                        <input
                          type="text"
                          value={noteForm.actionItems}
                          onChange={(e) => setNoteForm({ ...noteForm, actionItems: e.target.value })}
                          placeholder="Action Items"
                          className="w-full text-xs bg-white border border-border rounded-lg p-2 text-deep"
                        />
                        <Button size="sm" onClick={handleSaveNoteSubmit} className="text-xs py-1.5 bg-forest text-white font-bold">
                          Save Notes
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Display Notes */}
                <div className="space-y-3">
                  {(activeMeetingDetail.notes || []).length === 0 ? (
                    <div className="p-6 text-center text-muted border border-dashed border-border rounded-xl">
                      No teacher notes available for this meeting.
                    </div>
                  ) : (
                    activeMeetingDetail.notes.map((n) => {
                      const studentName = n.studentId ? `${n.studentId.firstName} ${n.studentId.lastName}` : 'Student';
                      return (
                        <div key={n._id} className="p-4 bg-white border border-border rounded-xl space-y-2">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="font-bold text-deep text-sm">{studentName}</span>
                            <span className="text-[10px] text-forest font-bold px-2 py-0.5 bg-emerald-50 rounded-md">
                              Teacher Feedback
                            </span>
                          </div>
                          {n.academicNotes && <p className="text-xs text-secondary"><strong>Academic Performance:</strong> {n.academicNotes}</p>}
                          {n.behaviourNotes && <p className="text-xs text-secondary"><strong>Behaviour:</strong> {n.behaviourNotes}</p>}
                          {n.improvementNotes && <p className="text-xs text-secondary"><strong>Areas to Improve:</strong> {n.improvementNotes}</p>}
                          {n.actionItems && <p className="text-xs text-secondary"><strong>Action Items:</strong> {n.actionItems}</p>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
