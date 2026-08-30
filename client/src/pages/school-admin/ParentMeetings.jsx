import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Send,
  XCircle,
  CheckCircle2,
  ClipboardList,
  Users,
  Clock,
  MapPin,
  FileText,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  BookOpen,
  RefreshCw,
  StickyNote,
  Filter,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import DataTable from '../../components/ui/DataTable';
import { parentMeetingApi } from '../../api/parentMeeting.api';
import { academicApi } from '../../api/academic.api';
import { teacherApi } from '../../api/teacher.api';

const MEETING_TYPES = [
  { value: 'parent_teacher_meeting', label: 'Parent Teacher Meeting' },
  { value: 'academic_review', label: 'Academic Review' },
  { value: 'progress_discussion', label: 'Progress Discussion' },
  { value: 'behaviour_discussion', label: 'Behaviour Discussion' },
  { value: 'general', label: 'General Parent Meeting' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE = { DRAFT: 'warning', PUBLISHED: 'primary', COMPLETED: 'success', CANCELLED: 'danger' };
const RSVP_BADGE = { PENDING: 'gray', GOING: 'success', MAYBE: 'warning', NOT_GOING: 'danger' };
const ATTENDANCE_BADGE = { PENDING: 'gray', ATTENDED: 'success', ABSENT: 'danger', NOT_SCHEDULED: 'gray' };

const typeLabel = (t) => MEETING_TYPES.find((x) => x.value === t)?.label || t;

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const toDateInputValue = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${day}`;
};

const initialForm = {
  title: '',
  type: 'parent_teacher_meeting',
  description: '',
  date: toDateInputValue(new Date()),
  startTime: '10:00',
  endTime: '12:00',
  location: '',
  instructions: '',
  classes: [],
  teachers: [],
};

export default function ParentMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  const [stats, setStats] = useState({ upcoming: 0, today: 0, completed: 0, parentsInvited: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [yearFilter, setYearFilter] = useState('all');

  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [yearsList, setYearsList] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimer = useRef(null);

  const [details, setDetails] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceMeeting, setAttendanceMeeting] = useState(null);
  const [attParticipants, setAttParticipants] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attSearch, setAttSearch] = useState('');
  const [attStatus, setAttStatus] = useState('all');

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesMeeting, setNotesMeeting] = useState(null);
  const [notesStudent, setNotesStudent] = useState(null);
  const [notesList, setNotesList] = useState([]);
  const [noteForm, setNoteForm] = useState({ note: '', visibility: 'INTERNAL' });
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    Promise.all([
      academicApi.getClasses({ limit: 200 }).then((r) => r.data || []).catch(() => []),
      academicApi.getSections({ limit: 1000 }).then((r) => r.data || []).catch(() => []),
      teacherApi.getAll({ limit: 200 }).then((r) => r.data || []).catch(() => []),
      academicApi.getAcademicYears({ limit: 100 }).then((r) => r.data || []).catch(() => []),
    ]).then(([c, s, t, y]) => {
      setClassesList(c);
      setSectionsList(s);
      setTeachersList(t);
      setYearsList(y);
    });
  }, []);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await parentMeetingApi.getStats();
        if (active) setStats(res.data || {});
      } catch {
        // stats are non-critical
      } finally {
        if (active) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    let active = true;
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 12,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          classId: classFilter !== 'all' ? classFilter : undefined,
          teacherId: teacherFilter !== 'all' ? teacherFilter : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          academicYearId: yearFilter !== 'all' ? yearFilter : undefined,
        };
        const res = await parentMeetingApi.getAll(params);
        if (active) {
          setMeetings(res.data || []);
          setMeta(res.meta || null);
        }
      } catch (err) {
        if (active) toast.error(err?.message || 'Unable to load parent meetings');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMeetings();
    return () => { active = false; };
  }, [page, search, statusFilter, typeFilter, classFilter, teacherFilter, dateFrom, dateTo, yearFilter, reload]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setClassFilter('all');
    setTeacherFilter('all');
    setDateFrom('');
    setDateTo('');
    setYearFilter('all');
    setPage(1);
  };

  const sectionName = useCallback(
    (sectionId) => sectionsList.find((s) => s._id === sectionId)?.name || '',
    [sectionsList]
  );

  const selectedClassPairs = useMemo(() => form.classes, [form.classes]);

  const runPreview = useCallback(
    async (pairs) => {
      if (!pairs?.length) {
        setPreview(null);
        return;
      }
      setPreviewLoading(true);
      try {
        const res = await parentMeetingApi.preview({ classes: pairs });
        setPreview(res.data || null);
        const suggestions = res.data?.teacherSuggestions || [];
        setForm((prev) => {
          const next = { ...prev };
          suggestions.forEach((cls) => {
            const hasSelection = (next.teachers || []).some((t) => t.classId === cls.classId);
            if (!hasSelection) {
              const recommended = cls.suggestions.filter((s) => s.role === 'Class Teacher');
              const toAdd = recommended.map((s) => ({
                teacherId: s.teacherId,
                classId: cls.classId,
                sectionId: cls.sectionId || null,
              }));
              next.teachers = [...(next.teachers || []), ...toAdd];
            }
          });
          return next;
        });
      } catch (err) {
        toast.error(err?.message || 'Unable to preview classes');
      } finally {
        setPreviewLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    if (!selectedClassPairs.length) return undefined;
    previewTimer.current = setTimeout(() => runPreview(selectedClassPairs), 500);
    return () => clearTimeout(previewTimer.current);
  }, [selectedClassPairs, runPreview]);

  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setForm(initialForm);
    setPreview(null);
    setClassSearch('');
    setFormOpen(true);
  };

  const handleOpenEdit = async (meeting) => {
    setEditingMeeting(meeting);
    try {
      const res = await parentMeetingApi.getById(meeting._id);
      const d = res.data || {};
      setForm({
        title: d.title || '',
        type: d.type || 'parent_teacher_meeting',
        description: d.description || '',
        date: toDateInputValue(d.date),
        startTime: d.startTime || '10:00',
        endTime: d.endTime || '12:00',
        location: d.location || '',
        instructions: d.instructions || '',
        classes: (d.classes || []).map((c) => ({ classId: c.classId, sectionId: c.sectionId || null })),
        teachers: (d.teachers || []).map((t) => ({
          teacherId: t.teacherId,
          classId: t.classId,
          sectionId: t.sectionId || null,
        })),
      });
      setPreview(null);
      setFormOpen(true);
    } catch (err) {
      toast.error(err?.message || 'Unable to load meeting');
    }
  };

  const toggleClass = (classId, sectionId) => {
    setForm((prev) => {
      const key = `${classId}:${sectionId || 'all'}`;
      const exists = prev.classes.some((c) => `${c.classId}:${c.sectionId || 'all'}` === key);
      let next = exists
        ? prev.classes.filter((c) => `${c.classId}:${c.sectionId || 'all'}` !== key)
        : [...prev.classes, { classId, sectionId: sectionId || null }];
      next = next.filter((c, i, arr) => arr.findIndex((x) => x.classId === c.classId && (x.sectionId || null) === (c.sectionId || null)) === i);
      if (!next.length) setPreview(null);
      return { ...prev, classes: next };
    });
  };

  const selectAllClasses = () => {
    const pairs = [];
    classesList.forEach((c) => {
      const sections = sectionsList.filter((s) => s.schoolClass === c._id);
      if (sections.length) {
        sections.forEach((s) => pairs.push({ classId: c._id, sectionId: s._id }));
      } else {
        pairs.push({ classId: c._id, sectionId: null });
      }
    });
    setForm((prev) => ({ ...prev, classes: pairs }));
  };

  const clearAllClasses = () => {
    setForm((prev) => ({ ...prev, classes: [], teachers: [] }));
    setPreview(null);
  };

  const toggleTeacher = (teacherId, classId, sectionId) => {
    setForm((prev) => {
      const exists = (prev.teachers || []).some(
        (t) => t.teacherId === teacherId && t.classId === classId && (t.sectionId || null) === (sectionId || null)
      );
      const next = exists
        ? (prev.teachers || []).filter(
            (t) => !(t.teacherId === teacherId && t.classId === classId && (t.sectionId || null) === (sectionId || null))
          )
        : [...(prev.teachers || []), { teacherId, classId, sectionId: sectionId || null }];
      return { ...prev, teachers: next };
    });
  };

  const isTeacherSelected = (teacherId, classId, sectionId) =>
    (form.teachers || []).some(
      (t) => t.teacherId === teacherId && t.classId === classId && (t.sectionId || null) === (sectionId || null)
    );

  const filteredClasses = useMemo(() => {
    if (!classSearch.trim()) return classesList;
    return classesList.filter((c) => c.name.toLowerCase().includes(classSearch.toLowerCase()));
  }, [classesList, classSearch]);

  const validateForm = () => {
    if (!form.title.trim()) { toast.error('Meeting title is required'); return false; }
    if (!form.date) { toast.error('Date is required'); return false; }
    if (!form.startTime || !form.endTime) { toast.error('Start and end time are required'); return false; }
    if (form.startTime >= form.endTime) { toast.error('End time must be after start time'); return false; }
    if (!form.classes.length) { toast.error('Select at least one class/section'); return false; }
    return true;
  };

  const saveMeeting = async (publishAfter) => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        description: form.description,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        instructions: form.instructions,
        classes: form.classes,
        teachers: form.teachers || [],
      };
      let meetingId;
      if (editingMeeting) {
        const res = await parentMeetingApi.update(editingMeeting._id, payload);
        meetingId = res.data?._id || editingMeeting._id;
      } else {
        const res = await parentMeetingApi.create(payload);
        meetingId = res.data?._id;
      }
      if (publishAfter) {
        await parentMeetingApi.publish(meetingId);
        toast.success('Meeting published and parents notified');
      } else {
        toast.success(editingMeeting ? 'Meeting updated' : 'Draft saved');
      }
      setFormOpen(false);
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Unable to save meeting');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (meeting) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Publish Meeting?',
      text: `"${meeting.title}" will be made visible to parents and they will be notified.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Publish & Notify',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#6C5CE7',
    });
    if (!isConfirmed) return;
    try {
      await parentMeetingApi.publish(meeting._id);
      toast.success('Meeting published and parents notified');
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Unable to publish meeting');
    }
  };

  const handleCancel = async (meeting) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Cancel Meeting?',
      text: `"${meeting.title}" will be cancelled and parents will be notified.`,
      icon: 'warning',
      input: 'textarea',
      inputPlaceholder: 'Reason (optional)',
      inputValue: '',
      showCancelButton: true,
      confirmButtonText: 'Cancel Meeting',
      cancelButtonText: 'Go Back',
      confirmButtonColor: '#dc2626',
    });
    if (!isConfirmed) return;
    try {
      await parentMeetingApi.cancel(meeting._id, reason || '');
      toast.success('Meeting cancelled and parents notified');
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Unable to cancel meeting');
    }
  };

  const handleComplete = async (meeting) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Complete Meeting?',
      text: `Mark "${meeting.title}" as completed?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Complete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#6C5CE7',
    });
    if (!isConfirmed) return;
    try {
      await parentMeetingApi.complete(meeting._id);
      toast.success('Meeting completed');
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Unable to complete meeting');
    }
  };

  const handleDelete = async (meeting) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Meeting?',
      text: `"${meeting.title}" will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });
    if (!isConfirmed) return;
    try {
      await parentMeetingApi.remove(meeting._id);
      toast.success('Meeting deleted');
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Unable to delete meeting');
    }
  };

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

  const openAttendance = async (meeting) => {
    setAttendanceMeeting(meeting);
    setAttendanceOpen(true);
    setAttLoading(true);
    setAttParticipants([]);
    setAttSearch('');
    setAttStatus('all');
    try {
      const res = await parentMeetingApi.getParticipants(meeting._id);
      setAttParticipants(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Unable to load participants');
    } finally {
      setAttLoading(false);
    }
  };

  const updateAttendance = async (participantId, status) => {
    try {
      await parentMeetingApi.markAttendance(attendanceMeeting._id, participantId, status);
      setAttParticipants((prev) =>
        prev.map((p) => (p.participantId === participantId ? { ...p, attendanceStatus: status } : p))
      );
      if (details) {
        setDetails((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: (prev.participants || []).map((p) =>
              p.participantId === participantId ? { ...p, attendanceStatus: status } : p
            ),
          };
        });
      }
      toast.success('Attendance updated');
    } catch (err) {
      toast.error(err?.message || 'Unable to update attendance');
    }
  };

  const bulkUpdateAttendance = async (status) => {
    const visible = filteredParticipants.filter((p) => p.attendanceStatus !== status);
    if (!visible.length) {
      toast('No participants to update');
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: `Mark ${visible.length} as ${status === 'ATTENDED' ? 'Attended' : 'Absent'}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#6C5CE7',
    });
    if (!isConfirmed) return;
    try {
      await parentMeetingApi.bulkAttendance(
        attendanceMeeting._id,
        visible.map((p) => ({ participantId: p.participantId, status }))
      );
      setAttParticipants((prev) =>
        prev.map((p) => (visible.some((v) => v.participantId === p.participantId) ? { ...p, attendanceStatus: status } : p))
      );
      toast.success('Attendance updated');
    } catch (err) {
      toast.error(err?.message || 'Unable to update attendance');
    }
  };

  const openNotes = (meeting, student) => {
    setNotesMeeting(meeting);
    setNotesStudent(student);
    const studentNotes = (details?.notes || []).filter((n) => n.studentId === student.studentId);
    setNotesList(studentNotes);
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

  const filteredParticipants = attParticipants.filter((p) => {
    const q = attSearch.toLowerCase();
    if (attStatus !== 'all' && p.attendanceStatus !== attStatus) return false;
    if (!q) return true;
    return `${p.parentName} ${p.studentName}`.toLowerCase().includes(q);
  });

  const tableColumns = [
    { key: 'date', label: 'Date', render: (r) => <span className="font-medium text-deep whitespace-nowrap">{formatDate(r.date)}</span> },
    {
      key: 'title',
      label: 'Meeting',
      render: (r) => (
        <div>
          <span className="font-semibold text-deep block">{r.title}</span>
          <span className="text-muted text-[11px]">{r.startTime} – {r.endTime}{r.location ? ` · ${r.location}` : ''}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (r) => <Badge color="gray">{r.typeLabel || typeLabel(r.type)}</Badge>,
    },
    {
      key: 'classes',
      label: 'Classes',
      render: (r) => (
        <span className="text-secondary whitespace-nowrap">
          {(r.classes || []).map((c) => `${c.className}${c.sectionName ? ` ${c.sectionName}` : ''}`).join(', ') || '—'}
        </span>
      ),
    },
    { key: 'teachersCount', label: 'Teachers', render: (r) => <span className="text-secondary">{r.teachersCount || 0}</span> },
    { key: 'parentsInvited', label: 'Parents Invited', render: (r) => <span className="text-secondary">{r.parentsInvited || 0}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge color={STATUS_BADGE[r.status] || 'gray'}>{r.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetails(r)} className="p-1.5 text-muted hover:text-forest rounded-lg hover:bg-surface transition-colors" title="View">
            <Eye size={15} />
          </button>
          {r.status === 'DRAFT' && (
            <button onClick={() => handleOpenEdit(r)} className="p-1.5 text-muted hover:text-deep rounded-lg hover:bg-surface transition-colors" title="Edit">
              <Edit2 size={15} />
            </button>
          )}
          {r.status === 'DRAFT' && (
            <button onClick={() => handlePublish(r)} className="p-1.5 text-muted hover:text-forest rounded-lg hover:bg-surface transition-colors" title="Publish">
              <Send size={15} />
            </button>
          )}
          {r.status === 'PUBLISHED' && (
            <>
              <button onClick={() => handleCancel(r)} className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-surface transition-colors" title="Cancel">
                <XCircle size={15} />
              </button>
              <button onClick={() => handleComplete(r)} className="p-1.5 text-muted hover:text-forest rounded-lg hover:bg-surface transition-colors" title="Complete">
                <CheckCircle2 size={15} />
              </button>
            </>
          )}
          {(r.status === 'PUBLISHED' || r.status === 'COMPLETED') && (
            <button onClick={() => openAttendance(r)} className="p-1.5 text-muted hover:text-info rounded-lg hover:bg-surface transition-colors" title="Manage Attendance">
              <ClipboardList size={15} />
            </button>
          )}
          {(r.status === 'DRAFT' || r.status === 'CANCELLED') && (
            <button onClick={() => handleDelete(r)} className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-surface transition-colors" title="Delete">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const statsCards = [
    { label: 'Upcoming Meetings', value: stats.upcoming, icon: CalendarClock, tint: 'bg-sage text-forest' },
    { label: 'Today', value: stats.today, icon: CalendarCheck, tint: 'bg-info-light text-info-text' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, tint: 'bg-success-light text-success-text' },
    { label: 'Parents Invited', value: stats.parentsInvited, icon: Users, tint: 'bg-warning-light text-warning-text' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent Meetings"
        description="Schedule and manage parent-teacher meetings."
        action={
          <Button onClick={handleOpenCreate}>
            <Plus size={16} className="mr-2" /> Schedule Meeting
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <Card key={s.label} className="!p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.tint}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-deep leading-none">
                  {statsLoading ? <span className="inline-block w-8 h-5 bg-surface rounded animate-pulse" /> : s.value}
                </p>
                <p className="text-xs text-muted mt-1">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="!p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              placeholder="Search meetings..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            <Select label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} />
            <Select label="Meeting Type" options={[{ value: 'all', label: 'All Types' }, ...MEETING_TYPES]} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} />
            <Select
              label="Class / Section"
              options={[{ value: 'all', label: 'All Classes' }, ...classesList.map((c) => ({ value: c._id, label: c.name }))]}
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
            />
            <Select
              label="Teacher"
              options={[{ value: 'all', label: 'All Teachers' }, ...teachersList.map((t) => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))]}
              value={teacherFilter}
              onChange={(e) => { setTeacherFilter(e.target.value); setPage(1); }}
            />
            <Select
              label="Academic Year"
              options={[{ value: 'all', label: 'All Years' }, ...yearsList.map((y) => ({ value: y._id, label: y.name }))]}
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep" />
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RefreshCw size={14} className="mr-1" /> Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      <div className="hidden md:block">
        <DataTable
          columns={tableColumns}
          data={meetings}
          loading={loading}
          meta={meta}
          onPageChange={setPage}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search meetings..."
        />
      </div>

      <div className="md:hidden space-y-3">
        {loading
          ? [1, 2, 3].map((i) => <div key={i} className="h-28 bg-white border border-border rounded-xl animate-pulse" />)
          : meetings.length === 0
            ? (
              <EmptyState title="No parent meetings found" description="Schedule a meeting to invite parents." />
            )
            : meetings.map((m) => (
              <div key={m._id} className="bg-white border border-border rounded-xl p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-deep text-sm">{m.title}</p>
                    <p className="text-xs text-muted mt-0.5">{formatDate(m.date)} · {m.startTime} – {m.endTime}</p>
                    <p className="text-xs text-secondary mt-1">
                      {(m.classes || []).map((c) => `${c.className}${c.sectionName ? ` ${c.sectionName}` : ''}`).join(', ')} · {m.teachersCount || 0} Teachers
                    </p>
                  </div>
                  <Badge color={STATUS_BADGE[m.status] || 'gray'}>{m.status}</Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openDetails(m)}>View</Button>
                  {m.status === 'DRAFT' && <Button size="sm" variant="outline" onClick={() => handleOpenEdit(m)}>Edit</Button>}
                  {m.status === 'DRAFT' && <Button size="sm" onClick={() => handlePublish(m)}>Publish</Button>}
                  {m.status === 'PUBLISHED' && <Button size="sm" variant="outline" onClick={() => openAttendance(m)}>Attendance</Button>}
                </div>
              </div>
            ))}
      </div>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingMeeting ? 'Edit Meeting' : 'Schedule Parent Meeting'} size="xl">
        <div className="space-y-4">
          <Input label="Meeting Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Parent Teacher Meeting" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Meeting Type *"
              options={MEETING_TYPES}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <Input label="Date *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Time *" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End Time *" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. School Auditorium" />
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs sm:text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest min-h-[70px]"
              placeholder="Brief description of the meeting"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs sm:text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest min-h-[70px]"
              placeholder="e.g. Parents should bring the student's previous report card."
            />
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-surface/60 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-deep">Classes / Sections</p>
                <p className="text-[11px] text-muted">Students and parents are detected automatically from selected classes.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    className="pl-8 pr-2 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 w-40"
                    placeholder="Search classes..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={selectAllClasses}>Select All</Button>
                <Button size="sm" variant="ghost" onClick={clearAllClasses}>Clear All</Button>
              </div>
            </div>
            {filteredClasses.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted text-center">No classes found.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-border/60">
                {filteredClasses.map((c) => {
                  const sections = sectionsList.filter((s) => s.schoolClass === c._id);
                  const pairs = sections.length ? sections.map((s) => s._id) : [null];
                  return (
                    <div key={c._id} className="px-4 py-2.5">
                      <p className="text-xs font-semibold text-deep mb-1.5">{c.name}</p>
                      <div className="flex flex-wrap gap-3">
                        {pairs.map((sid) => {
                          const checked = form.classes.some((x) => x.classId === c._id && (x.sectionId || null) === sid);
                          return (
                            <label key={sid || 'all'} className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleClass(c._id, sid)}
                                className="accent-forest w-3.5 h-3.5"
                              />
                              <span className="text-xs text-secondary">{sid ? `Section ${sectionName(sid)}` : 'All Sections'}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {form.classes.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-surface/60 border-b border-border">
                <p className="text-sm font-semibold text-deep">Teachers</p>
                <p className="text-[11px] text-muted">Recommended teachers are pre-selected from class and subject assignments.</p>
              </div>
              <div className="p-4">
                {previewLoading ? (
                  <div className="h-24 bg-surface rounded-lg animate-pulse" />
                ) : preview ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-surface rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-deep">{preview.studentsCount}</p>
                        <p className="text-[11px] text-muted">Students</p>
                      </div>
                      <div className="bg-surface rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-deep">{preview.parentsCount}</p>
                        <p className="text-[11px] text-muted">Parents</p>
                      </div>
                      <div className="bg-surface rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-deep">{form.teachers?.length || 0}</p>
                        <p className="text-[11px] text-muted">Teachers Assigned</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {(preview.teacherSuggestions || []).map((cls) => (
                        <div key={cls.classId} className="border border-border rounded-lg p-3">
                          <p className="text-xs font-semibold text-deep mb-2">
                            {cls.className}{cls.sectionName ? ` — Section ${cls.sectionName}` : ''}
                          </p>
                          {cls.suggestions.length === 0 ? (
                            <p className="text-[11px] text-muted">No teachers found for this class.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {cls.suggestions.map((s) => (
                                <label key={s.teacherId} className="inline-flex items-center gap-1.5 cursor-pointer border border-border rounded-lg px-2.5 py-1.5 hover:bg-surface transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isTeacherSelected(s.teacherId, cls.classId, cls.sectionId || null)}
                                    onChange={() => toggleTeacher(s.teacherId, cls.classId, cls.sectionId || null)}
                                    className="accent-forest w-3.5 h-3.5"
                                  />
                                  <span className="text-xs text-secondary">{s.name}</span>
                                  <Badge color={s.role === 'Class Teacher' ? 'primary' : 'gray'}>{s.role}</Badge>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted text-center py-4">Select classes to see students, parents, and teacher suggestions.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="outline" loading={saving} onClick={() => saveMeeting(false)}>Save Draft</Button>
            <Button loading={saving} onClick={() => saveMeeting(true)}>Save & Publish</Button>
          </div>
        </div>
      </Modal>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <CalendarIcon size={15} className="text-muted" /> {formatDate(details.date)} · {details.startTime} – {details.endTime}
              </div>
              {details.location && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <MapPin size={15} className="text-muted" /> {details.location}
                </div>
              )}
              {details.instructions && (
                <div className="flex items-start gap-2 text-sm text-secondary sm:col-span-2">
                  <FileText size={15} className="text-muted mt-0.5" /> <span>{details.instructions}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-deep">{details.parentsInvited}</p>
                <p className="text-[11px] text-muted">Parents Invited</p>
              </div>
              <div className="bg-surface rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-deep">{details.rsvpBreakdown?.GOING || 0}</p>
                <p className="text-[11px] text-muted">Going</p>
              </div>
              <div className="bg-surface rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-deep">{details.attendanceBreakdown?.ATTENDED || 0}</p>
                <p className="text-[11px] text-muted">Attended</p>
              </div>
              <div className="bg-surface rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-deep">
                  {details.attendanceRate !== undefined ? `${details.attendanceRate}%` : '—'}
                </p>
                <p className="text-[11px] text-muted">Attendance Rate</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Teachers</p>
              <div className="flex flex-wrap gap-2">
                {details.teachers?.length ? details.teachers.map((t, i) => (
                  <Badge key={i} color="primary">{t.name}{t.className ? ` · ${t.className}${t.sectionName ? ` ${t.sectionName}` : ''}` : ''}</Badge>
                )) : <p className="text-xs text-muted">No teachers assigned.</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Participants</p>
                {(details.status === 'PUBLISHED' || details.status === 'COMPLETED') && (
                  <Button size="sm" variant="outline" onClick={() => openAttendance({ _id: details._id })}>
                    <ClipboardList size={14} className="mr-1" /> Manage Attendance
                  </Button>
                )}
              </div>
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-surface/70">
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Parent</th>
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Student</th>
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">RSVP</th>
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Attendance</th>
                        <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {details.participants?.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-muted">No participants yet.</td></tr>
                      )}
                      {details.participants?.map((p) => (
                        <tr key={p.participantId}>
                          <td className="px-3 py-2 text-xs text-deep">{p.parentName}</td>
                          <td className="px-3 py-2 text-xs text-deep">{p.studentName} <span className="text-muted">· {p.className}{p.sectionName ? ` ${p.sectionName}` : ''}</span></td>
                          <td className="px-3 py-2"><Badge color={RSVP_BADGE[p.rsvpStatus] || 'gray'}>{p.rsvpStatus}</Badge></td>
                          <td className="px-3 py-2"><Badge color={ATTENDANCE_BADGE[p.attendanceStatus] || 'gray'}>{p.attendanceStatus}</Badge></td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => openNotes({ _id: details._id }, p)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-hover"
                            >
                              <StickyNote size={13} /> Notes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {details.description && (
              <div>
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-secondary">{details.description}</p>
              </div>
            )}

            {details.status === 'COMPLETED' && (
              <div className="bg-success-light/60 border border-success/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-success-text mb-2">Meeting Summary</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-secondary">
                  <span>Invited: <b>{details.parentsInvited}</b></span>
                  <span>Going: <b>{details.rsvpBreakdown?.GOING || 0}</b></span>
                  <span>Maybe: <b>{details.rsvpBreakdown?.MAYBE || 0}</b></span>
                  <span>Not Going: <b>{details.rsvpBreakdown?.NOT_GOING || 0}</b></span>
                  <span>Attended: <b>{details.attendanceBreakdown?.ATTENDED || 0}</b></span>
                  <span>Absent: <b>{details.attendanceBreakdown?.ABSENT || 0}</b></span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {details.permissions?.canEdit && (
                <Button variant="outline" onClick={() => { setDetailsOpen(false); handleOpenEdit(details); }}>
                  <Edit2 size={14} className="mr-1" /> Edit
                </Button>
              )}
              {details.permissions?.canPublish && (
                <Button onClick={() => handlePublish(details)}><Send size={14} className="mr-1" /> Publish</Button>
              )}
              {details.permissions?.canCancel && (
                <Button variant="danger" onClick={() => { setDetailsOpen(false); handleCancel(details); }}>
                  <XCircle size={14} className="mr-1" /> Cancel
                </Button>
              )}
              {details.permissions?.canComplete && (
                <Button onClick={() => handleComplete(details)}><CheckCircle2 size={14} className="mr-1" /> Complete Meeting</Button>
              )}
              {details.permissions?.canDelete && (
                <Button variant="danger" onClick={() => { setDetailsOpen(false); handleDelete(details); }}>
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={attendanceOpen} onClose={() => setAttendanceOpen(false)} title="Parent Meeting Attendance" size="xl">
        {attendanceMeeting && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-deep">{attendanceMeeting.title}</p>
                <p className="text-xs text-muted">{formatDate(attendanceMeeting.date)} · {attendanceMeeting.startTime} – {attendanceMeeting.endTime}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => bulkUpdateAttendance('ATTENDED')}>Mark All Attended</Button>
                <Button size="sm" variant="outline" onClick={() => bulkUpdateAttendance('ABSENT')}>Mark All Absent</Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20"
                  placeholder="Search parent/student..."
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                />
              </div>
              <Select
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'ATTENDED', label: 'Attended' },
                  { value: 'ABSENT', label: 'Absent' },
                ]}
                value={attStatus}
                onChange={(e) => setAttStatus(e.target.value)}
                className="sm:w-44"
              />
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-surface/70">
                      <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Parent</th>
                      <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Student</th>
                      <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">RSVP</th>
                      <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Status</th>
                      <th className="px-3 py-2 text-xs font-semibold text-secondary uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {attLoading ? (
                      [1, 2, 3, 4].map((i) => (
                        <tr key={i}>
                          <td colSpan={5} className="px-3 py-3"><div className="h-4 bg-surface rounded animate-pulse w-full" /></td>
                        </tr>
                      ))
                    ) : filteredParticipants.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-8 text-center text-xs text-muted">No participants found.</td></tr>
                    ) : filteredParticipants.map((p) => (
                      <tr key={p.participantId}>
                        <td className="px-3 py-2 text-xs text-deep">{p.parentName}</td>
                        <td className="px-3 py-2 text-xs text-deep">{p.studentName} <span className="text-muted">· {p.className}{p.sectionName ? ` ${p.sectionName}` : ''}</span></td>
                        <td className="px-3 py-2"><Badge color={RSVP_BADGE[p.rsvpStatus] || 'gray'}>{p.rsvpStatus}</Badge></td>
                        <td className="px-3 py-2"><Badge color={ATTENDANCE_BADGE[p.attendanceStatus] || 'gray'}>{p.attendanceStatus}</Badge></td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="outline" disabled={p.attendanceStatus === 'ATTENDED'} onClick={() => updateAttendance(p.participantId, 'ATTENDED')}>
                              <CheckCircle2 size={13} className="mr-1 text-success-text" /> Attended
                            </Button>
                            <Button size="sm" variant="outline" disabled={p.attendanceStatus === 'ABSENT'} onClick={() => updateAttendance(p.participantId, 'ABSENT')}>
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
                placeholder="Write meeting notes for this student..."
              />
              <div className="flex items-center justify-between gap-2 mt-2">
                <Select
                  options={[
                    { value: 'INTERNAL', label: 'Internal (staff only)' },
                    { value: 'PARENT_VISIBLE', label: 'Parent Visible' },
                  ]}
                  value={noteForm.visibility}
                  onChange={(e) => setNoteForm({ ...noteForm, visibility: e.target.value })}
                  className="sm:w-56"
                />
                <Button loading={savingNote} onClick={saveNote}>Save Note</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}