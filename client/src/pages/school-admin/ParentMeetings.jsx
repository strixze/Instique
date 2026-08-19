import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Users, Plus, Search, Filter, RotateCcw, MoreVertical, MapPin,
  Clock, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Eye,
  Edit3, Trash2, Send, XCircle, Download, FileText, Check, UserCheck,
  UserX, HelpCircle, BookOpen, Info, ShieldAlert, Sparkles
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { meetingApi } from '../../api/meeting.api';
import { academicApi } from '../../api/academic.api';
import { teacherApi } from '../../api/teacher.api';
import { useUserStore } from '../../store/userStore';

const MEETING_TYPES = [
  { value: 'ptm', label: 'Parent-Teacher Meeting', color: 'bg-blue-500 text-blue-700 bg-blue-50' },
  { value: 'academic_review', label: 'Academic Review', color: 'bg-purple-500 text-purple-700 bg-purple-50' },
  { value: 'progress_discussion', label: 'Progress Discussion', color: 'bg-emerald-500 text-emerald-700 bg-emerald-50' },
  { value: 'behaviour_discussion', label: 'Behaviour Discussion', color: 'bg-amber-500 text-amber-700 bg-amber-50' },
  { value: 'general', label: 'General Parent Meeting', color: 'bg-indigo-500 text-indigo-700 bg-indigo-50' },
  { value: 'other', label: 'Other', color: 'bg-slate-500 text-slate-700 bg-slate-100' },
];

function getMeetingTypeBadge(typeKey) {
  const typeObj = MEETING_TYPES.find((t) => t.value === typeKey) || MEETING_TYPES[0];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeObj.color}`}>
      {typeObj.label}
    </span>
  );
}

function getStatusBadge(status) {
  switch (status) {
    case 'published':
      return <Badge color="success">Published</Badge>;
    case 'completed':
      return <Badge color="primary">Completed</Badge>;
    case 'cancelled':
      return <Badge color="danger">Cancelled</Badge>;
    case 'draft':
    default:
      return <Badge color="gray">Draft</Badge>;
  }
}

export default function ParentMeetings() {
  const user = useUserStore((s) => s.user);
  const isSchoolAdmin = user?.role === 'school_admin' || user?.role === 'super_admin';

  // ── Data States ──
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    todayCount: 0,
    completedCount: 0,
    parentsInvitedCount: 0,
  });

  const [classesList, setClassesList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);

  // ── Filters State ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  // ── Modals State ──
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeMeetingDetail, setActiveMeetingDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' | 'attendance' | 'notes'
  const [saving, setSaving] = useState(false);
  const [actionMenuId, setActionMenuId] = useState(null);

  // ── Scheduling Form State ──
  const [classSearch, setClassSearch] = useState('');
  const [form, setForm] = useState({
    title: '',
    type: 'ptm',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '02:00 PM',
    location: 'School Campus',
    instructions: '',
    targetClasses: [],
    targetSections: [],
    assignedTeachers: [],
    status: 'draft',
  });

  // Load Classes & Teachers on Mount
  useEffect(() => {
    academicApi.getClasses({ limit: 100 })
      .then((res) => setClassesList(res.data || []))
      .catch(() => {});

    teacherApi.getAll({ limit: 100 })
      .then((res) => setTeachersList(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch Stats
  const fetchStats = () => {
    setStatsLoading(true);
    meetingApi.getStats()
      .then((res) => setStats(res.data || {}))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  // Fetch Meetings
  const fetchMeetings = () => {
    setLoading(true);
    const params = {
      limit: 100,
      search: search ? search : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      classId: classFilter !== 'all' ? classFilter : undefined,
      teacherId: teacherFilter !== 'all' ? teacherFilter : undefined,
      dateRange: dateRangeFilter !== 'all' ? dateRangeFilter : undefined,
    };

    meetingApi.getAll(params)
      .then((res) => setMeetings(res.data || []))
      .catch((e) => toast.error(e?.message || 'Failed to load parent meetings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [statusFilter, typeFilter, classFilter, teacherFilter, dateRangeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMeetings();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setClassFilter('all');
    setTeacherFilter('all');
    setDateRangeFilter('all');
    fetchMeetings();
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (classFilter !== 'all') count++;
    if (teacherFilter !== 'all') count++;
    if (dateRangeFilter !== 'all') count++;
    return count;
  }, [search, statusFilter, typeFilter, classFilter, teacherFilter, dateRangeFilter]);

  // ── Audience preview calculation for Form ──
  const audiencePreview = useMemo(() => {
    if (form.targetClasses.length === 0) return { studentCount: 0, teacherCount: form.assignedTeachers.length };

    const selectedClasses = classesList.filter((c) => form.targetClasses.includes(c._id));
    // Estimate or calculate student strength
    const studentCount = selectedClasses.reduce((acc, c) => acc + (c.sections?.reduce((sAcc, s) => sAcc + (s.strength || 15), 0) || 30), 0);
    return {
      studentCount,
      parentCount: Math.round(studentCount * 0.95), // standard estimation
      teacherCount: form.assignedTeachers.length,
    };
  }, [form.targetClasses, form.assignedTeachers, classesList]);

  // ── Class selection helpers ──
  const filteredFormClasses = useMemo(() => {
    if (!classSearch) return classesList;
    return classesList.filter((c) => c.name.toLowerCase().includes(classSearch.toLowerCase()));
  }, [classesList, classSearch]);

  const handleSelectAllClasses = () => {
    const allIds = classesList.map((c) => c._id);
    const recommendedTeachers = classesList
      .map((c) => c.classTeacher?._id || c.classTeacher)
      .filter(Boolean);

    const mergedTeachers = Array.from(new Set([...form.assignedTeachers, ...recommendedTeachers]));

    setForm({
      ...form,
      targetClasses: allIds,
      assignedTeachers: mergedTeachers,
    });
  };

  const handleClearAllClasses = () => {
    setForm({ ...form, targetClasses: [], targetSections: [] });
  };

  const handleToggleClass = (classObj) => {
    const isSelected = form.targetClasses.includes(classObj._id);
    let newTargetClasses = [];
    if (isSelected) {
      newTargetClasses = form.targetClasses.filter((id) => id !== classObj._id);
    } else {
      newTargetClasses = [...form.targetClasses, classObj._id];
    }

    // Auto recommend teacher if class teacher exists
    let newAssignedTeachers = [...form.assignedTeachers];
    const classTeacherId = classObj.classTeacher?._id || classObj.classTeacher;
    if (!isSelected && classTeacherId && !newAssignedTeachers.includes(classTeacherId)) {
      newAssignedTeachers.push(classTeacherId);
    }

    setForm({
      ...form,
      targetClasses: newTargetClasses,
      assignedTeachers: newAssignedTeachers,
    });
  };

  const handleToggleTeacher = (teacherId) => {
    const isSelected = form.assignedTeachers.includes(teacherId);
    if (isSelected) {
      setForm({ ...form, assignedTeachers: form.assignedTeachers.filter((id) => id !== teacherId) });
    } else {
      setForm({ ...form, assignedTeachers: [...form.assignedTeachers, teacherId] });
    }
  };

  // ── Form Modal Handler ──
  const openFormModal = (meetingToEdit = null) => {
    if (meetingToEdit) {
      setEditMeeting(meetingToEdit);
      setForm({
        title: meetingToEdit.title || '',
        type: meetingToEdit.type || 'ptm',
        description: meetingToEdit.description || '',
        date: meetingToEdit.date ? new Date(meetingToEdit.date).toISOString().split('T')[0] : '',
        startTime: meetingToEdit.startTime || '10:00 AM',
        endTime: meetingToEdit.endTime || '02:00 PM',
        location: meetingToEdit.location || 'School Campus',
        instructions: meetingToEdit.instructions || '',
        targetClasses: meetingToEdit.targetClasses ? meetingToEdit.targetClasses.map((c) => c._id || c) : [],
        targetSections: meetingToEdit.targetSections ? meetingToEdit.targetSections.map((s) => s._id || s) : [],
        assignedTeachers: meetingToEdit.assignedTeachers ? meetingToEdit.assignedTeachers.map((t) => t._id || t) : [],
        status: meetingToEdit.status || 'draft',
      });
    } else {
      setEditMeeting(null);
      setForm({
        title: '',
        type: 'ptm',
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00 AM',
        endTime: '02:00 PM',
        location: 'School Campus',
        instructions: '',
        targetClasses: [],
        targetSections: [],
        assignedTeachers: [],
        status: 'draft',
      });
    }
    setFormModalOpen(true);
  };

  const handleSaveMeeting = async (publish = false) => {
    if (!form.title.trim() || !form.date || form.targetClasses.length === 0) {
      toast.error('Meeting Title, Date, and at least one Class are required');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      status: publish ? 'published' : form.status,
    };

    try {
      if (editMeeting) {
        await meetingApi.update(editMeeting._id, payload);
        toast.success(publish ? 'Parent Meeting published' : 'Parent Meeting updated');
      } else {
        await meetingApi.create(payload);
        toast.success(publish ? 'Parent Meeting scheduled and published!' : 'Parent Meeting saved as draft');
      }
      setFormModalOpen(false);
      fetchMeetings();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to save Parent Meeting');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishMeeting = async (id) => {
    try {
      await meetingApi.publish(id);
      toast.success('Parent Meeting published and notifications sent');
      fetchMeetings();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to publish meeting');
    }
  };

  const handleCancelMeeting = async (id) => {
    try {
      await meetingApi.cancel(id);
      toast.success('Parent Meeting cancelled');
      fetchMeetings();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to cancel meeting');
    }
  };

  const handleDeleteMeeting = (meeting) => {
    Swal.fire({
      title: 'Delete Parent Meeting?',
      text: `Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Meeting',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await meetingApi.delete(meeting._id);
        toast.success('Parent Meeting deleted');
        fetchMeetings();
        fetchStats();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete meeting');
      }
    });
  };

  // ── Open Details Drawer ──
  const openDetailModal = async (meetingId) => {
    try {
      setDetailModalOpen(true);
      const res = await meetingApi.getById(meetingId);
      setActiveMeetingDetail(res.data);
      setDetailTab('overview');
    } catch (e) {
      toast.error(e?.message || 'Failed to fetch meeting details');
    }
  };

  // ── Attendance Status update handler ──
  const handleUpdateAttendanceStatus = async (parentId, studentId, status) => {
    if (!activeMeetingDetail) return;
    try {
      await meetingApi.markAttendance(activeMeetingDetail._id, { parentId, studentId, status });
      toast.success('Attendance updated');
      const res = await meetingApi.getById(activeMeetingDetail._id);
      setActiveMeetingDetail(res.data);
      fetchMeetings();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to update attendance');
    }
  };

  // ── Note Save Handler ──
  const [noteForm, setNoteForm] = useState({
    studentId: '',
    academicNotes: '',
    behaviourNotes: '',
    improvementNotes: '',
    actionItems: '',
    note: '',
    visibility: 'parent_visible',
  });

  const handleOpenAddNote = (studentId) => {
    const existing = (activeMeetingDetail?.notes || []).find((n) => n.studentId?._id === studentId || n.studentId === studentId);
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
      toast.success('Meeting notes saved');
      const res = await meetingApi.getById(activeMeetingDetail._id);
      setActiveMeetingDetail(res.data);
      setNoteForm({ studentId: '', academicNotes: '', behaviourNotes: '', improvementNotes: '', actionItems: '', note: '', visibility: 'parent_visible' });
    } catch (e) {
      toast.error(e?.message || 'Failed to save meeting notes');
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = async (meetingId) => {
    try {
      const response = await meetingApi.exportReport(meetingId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PTM_Attendance_Report_${meetingId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (e) {
      toast.error('Failed to export CSV report');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight flex items-center gap-2">
            <Users className="text-forest" size={24} />
            Parent Meetings
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Schedule and manage parent-teacher meetings.
          </p>
        </div>

        {isSchoolAdmin && (
          <Button
            onClick={() => openFormModal(null)}
            className="self-start sm:self-auto flex items-center gap-2 text-xs py-2.5 px-4 bg-forest hover:bg-forest/90 text-white font-semibold rounded-xl shadow-xs"
          >
            <Plus size={16} /> Schedule Meeting
          </Button>
        )}
      </div>

      {/* ── 2. Summary Statistics (4 Cards from DB) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Upcoming Meetings */}
        <Card padding={false} className="p-4 bg-white border border-border rounded-xl flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-forest flex items-center justify-center shrink-0">
            <CalendarIcon size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">Upcoming Meetings</span>
            <div className="text-xl font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.upcomingCount || 0}
            </div>
            <span className="text-[11px] text-secondary">Scheduled & Published</span>
          </div>
        </Card>

        {/* Card 2: Today */}
        <Card padding={false} className="p-4 bg-white border border-border rounded-xl flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">Today</span>
            <div className="text-xl font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.todayCount || 0}
            </div>
            <span className="text-[11px] text-secondary">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </Card>

        {/* Card 3: Completed */}
        <Card padding={false} className="p-4 bg-white border border-border rounded-xl flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">Completed</span>
            <div className="text-xl font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.completedCount || 0}
            </div>
            <span className="text-[11px] text-secondary">Past Parent Meetings</span>
          </div>
        </Card>

        {/* Card 4: Parents Invited */}
        <Card padding={false} className="p-4 bg-white border border-border rounded-xl flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">Parents Invited</span>
            <div className="text-xl font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.parentsInvitedCount || 0}
            </div>
            <span className="text-[11px] text-secondary">Total Parents Reached</span>
          </div>
        </Card>
      </div>

      {/* ── 3. Search & Filter Controls ── */}
      <Card padding={false} className="p-4 bg-white border border-border rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings by title, location or instructions..."
              className="w-full text-xs bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-deep focus:outline-none focus:border-forest"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Meeting Type Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium cursor-pointer"
            >
              <option value="all">All Meeting Types</option>
              {MEETING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classesList.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Reset & Action Buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="py-2 px-3 text-xs flex items-center gap-1 shrink-0"
            >
              <RotateCcw size={13} /> Reset
            </Button>
            <div className="px-3 py-2 bg-forest/10 border border-forest/20 text-forest rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5">
              <Filter size={13} /> Filters {activeFiltersCount}
            </div>
          </div>
        </form>
      </Card>

      {/* ── 4. Main Meeting Table List ── */}
      <Card padding={false} className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/60 border-b border-border text-[11px] font-bold text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Meeting</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Classes</th>
                <th className="py-3 px-4">Teachers</th>
                <th className="py-3 px-4">Parents Invited</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-deep font-medium">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Users size={36} className="mx-auto text-muted mb-2 opacity-50" />
                    <p className="text-sm font-bold text-deep">No parent meetings found</p>
                    <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                      {activeFiltersCount > 0
                        ? 'Try clearing or updating your filters to view scheduled parent meetings.'
                        : 'No parent meetings have been scheduled yet.'}
                    </p>
                    {isSchoolAdmin && activeFiltersCount === 0 && (
                      <Button size="sm" onClick={() => openFormModal(null)} className="mt-4 text-xs bg-forest text-white">
                        <Plus size={14} className="mr-1" /> Schedule Meeting
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                meetings.map((m) => {
                  const dateObj = new Date(m.date);
                  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                  const classesNames = m.targetClasses && m.targetClasses.length > 0
                    ? m.targetClasses.map((c) => c.name).join(', ')
                    : 'All School';

                  const teachersText = m.assignedTeachers && m.assignedTeachers.length > 0
                    ? `${m.assignedTeachers.length} Teachers`
                    : 'Class Teachers';

                  const parentCount = m.invitedParents?.length || 0;

                  return (
                    <tr key={m._id} className="hover:bg-surface/40 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-bold text-deep whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon size={14} className="text-forest shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="text-[10px] font-normal text-muted mt-0.5">
                          {m.startTime} – {m.endTime}
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => openDetailModal(m._id)}
                          className="font-bold text-deep hover:text-forest transition-colors cursor-pointer"
                        >
                          {m.title}
                        </div>
                        {m.location && (
                          <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5">
                            <MapPin size={11} /> {m.location}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getMeetingTypeBadge(m.type)}
                      </td>

                      {/* Target Classes */}
                      <td className="py-3.5 px-4 font-semibold text-secondary">
                        {classesNames}
                      </td>

                      {/* Teachers */}
                      <td className="py-3.5 px-4 text-secondary">
                        {teachersText}
                      </td>

                      {/* Parents Invited */}
                      <td className="py-3.5 px-4 font-bold text-deep">
                        {parentCount} Parents
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(m.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetailModal(m._id)}
                            className="p-1.5 rounded-lg text-secondary hover:text-forest hover:bg-surface transition-colors"
                            title="View Meeting & Attendance"
                          >
                            <Eye size={15} />
                          </button>

                          {isSchoolAdmin && (
                            <button
                              onClick={() => openFormModal(m)}
                              className="p-1.5 rounded-lg text-secondary hover:text-forest hover:bg-surface transition-colors"
                              title="Edit Meeting"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          {/* Action Dropdown Menu */}
                          <button
                            onClick={() => setActionMenuId(actionMenuId === m._id ? null : m._id)}
                            className="p-1.5 rounded-lg text-muted hover:text-deep hover:bg-surface transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {actionMenuId === m._id && (
                            <div className="absolute right-4 top-10 w-44 bg-white border border-border rounded-xl shadow-lg z-20 py-1 text-xs text-left">
                              <button
                                onClick={() => { openDetailModal(m._id); setActionMenuId(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-deep font-medium"
                              >
                                <Eye size={14} className="text-muted" /> View Details
                              </button>

                              <button
                                onClick={() => { handleExportCSV(m._id); setActionMenuId(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-deep font-medium"
                              >
                                <Download size={14} className="text-muted" /> Export Report CSV
                              </button>

                              {isSchoolAdmin && (
                                <>
                                  {m.status === 'draft' && (
                                    <button
                                      onClick={() => { handlePublishMeeting(m._id); setActionMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-forest font-medium"
                                    >
                                      <Send size={14} /> Publish Meeting
                                    </button>
                                  )}

                                  {m.status === 'published' && (
                                    <button
                                      onClick={() => { handleCancelMeeting(m._id); setActionMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-amber-600 font-medium"
                                    >
                                      <XCircle size={14} /> Cancel Meeting
                                    </button>
                                  )}

                                  <button
                                    onClick={() => { handleDeleteMeeting(m); setActionMenuId(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-danger font-medium border-t border-border mt-1 pt-1"
                                  >
                                    <Trash2 size={14} /> Delete Meeting
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 5. Schedule / Edit Meeting Modal ── */}
      {formModalOpen && (
        <Modal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          title={editMeeting ? 'Edit Parent Meeting' : 'Schedule Parent Meeting'}
          size="lg"
        >
          <div className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
            {/* Title & Meeting Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-deep block mb-1">
                  Meeting Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Parent Teacher Meeting 2026"
                  className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-deep block mb-1">
                  Meeting Type <span className="text-danger">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium"
                >
                  {MEETING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date, Start Time & End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-deep block mb-1">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-deep block mb-1">
                  Start Time <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  placeholder="10:00 AM"
                  className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-deep block mb-1">
                  End Time <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  placeholder="02:00 PM"
                  className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium"
                />
              </div>
            </div>

            {/* Location & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-deep block mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. School Auditorium / Online"
                  className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-deep block mb-1">Meeting Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief summary of meeting objectives..."
                  className="w-full text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep font-medium"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="text-xs font-bold text-deep block mb-1">Instructions for Parents</label>
              <textarea
                rows={2}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="e.g. Parents should bring student's previous report card and fee receipts."
                className="w-full text-xs bg-surface border border-border rounded-lg p-3 text-deep font-medium focus:outline-none focus:border-forest"
              />
            </div>

            {/* ── Class / Section Selection ── */}
            <div className="border border-border rounded-xl p-4 bg-surface/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-deep uppercase tracking-wider">Select Classes & Sections</span>
                  <span className="text-[11px] px-2 py-0.5 bg-sage text-forest font-bold rounded-md">
                    {form.targetClasses.length} Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-xs font-semibold text-forest hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-muted">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllClasses}
                    className="text-xs font-semibold text-secondary hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Class Search input */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Search classes..."
                  className="w-full text-xs bg-white border border-border rounded-lg pl-8 pr-3 py-1.5 text-deep focus:outline-none focus:border-forest"
                />
              </div>

              {/* Class Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pt-1">
                {filteredFormClasses.map((cls) => {
                  const isChecked = form.targetClasses.includes(cls._id);
                  return (
                    <label
                      key={cls._id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-forest bg-sage/50 font-bold text-forest'
                          : 'border-border bg-white text-secondary hover:bg-surface'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleClass(cls)}
                        className="rounded accent-forest cursor-pointer"
                      />
                      <span className="truncate">{cls.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Teacher Assignment ── */}
            <div className="border border-border rounded-xl p-4 bg-surface/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-deep uppercase tracking-wider">Assign Teachers</span>
                <span className="text-[11px] text-muted">Class teachers automatically recommended</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                {teachersList.map((tch) => {
                  const isSelected = form.assignedTeachers.includes(tch._id);
                  const name = `${tch.firstName} ${tch.lastName}`;
                  return (
                    <label
                      key={tch._id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-forest bg-sage/50 font-bold text-forest'
                          : 'border-border bg-white text-secondary hover:bg-surface'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTeacher(tch._id)}
                        className="rounded accent-forest cursor-pointer"
                      />
                      <span className="truncate">{name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Parent Audience Live Calculation Preview ── */}
            <div className="px-4 py-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-forest">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles size={16} />
                <span>Audience Calculation:</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span>Students: <strong>{audiencePreview.studentCount}</strong></span>
                <span>Parents Invited: <strong>{audiencePreview.parentCount}</strong></span>
                <span>Teachers: <strong>{audiencePreview.teacherCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setFormModalOpen(false)} className="text-xs py-2">
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => handleSaveMeeting(false)}
              className="text-xs py-2 border-forest text-forest hover:bg-forest/10"
            >
              Save Draft
            </Button>
            <Button
              disabled={saving}
              onClick={() => handleSaveMeeting(true)}
              className="text-xs py-2 bg-forest text-white font-bold"
            >
              {saving ? 'Publishing...' : 'Publish Meeting'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── 6. Meeting Details & Attendance Drawer / Modal ── */}
      {detailModalOpen && activeMeetingDetail && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Meeting Details — ${activeMeetingDetail.title}`}
          size="lg"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Header Info Banner */}
            <div className="p-4 bg-surface/50 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-deep">{activeMeetingDetail.title}</h3>
                  {getMeetingTypeBadge(activeMeetingDetail.type)}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><CalendarIcon size={13} /> {new Date(activeMeetingDetail.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={13} /> {activeMeetingDetail.startTime} – {activeMeetingDetail.endTime}</span>
                  {activeMeetingDetail.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin size={13} /> {activeMeetingDetail.location}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(activeMeetingDetail.status)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportCSV(activeMeetingDetail._id)}
                  className="text-xs py-1.5 flex items-center gap-1"
                >
                  <Download size={13} /> Export CSV
                </Button>
              </div>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div className="flex items-center gap-2 border-b border-border pb-1">
              {[
                { key: 'overview', label: 'Overview & Details' },
                { key: 'attendance', label: `Attendance (${activeMeetingDetail.attendance?.length || 0})` },
                { key: 'notes', label: `Student Notes (${activeMeetingDetail.notes?.length || 0})` },
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
              <div className="space-y-4 text-xs text-deep">
                {activeMeetingDetail.instructions && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    <strong className="block mb-0.5">Instructions:</strong>
                    {activeMeetingDetail.instructions}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 border border-border rounded-xl space-y-1">
                    <span className="text-muted font-semibold block text-[11px]">Participating Classes</span>
                    <p className="font-bold">
                      {activeMeetingDetail.targetClasses?.map((c) => c.name).join(', ') || 'All Classes'}
                    </p>
                  </div>

                  <div className="p-3 border border-border rounded-xl space-y-1">
                    <span className="text-muted font-semibold block text-[11px]">Assigned Teachers</span>
                    <p className="font-bold">
                      {activeMeetingDetail.assignedTeachers?.map((t) => `${t.firstName} ${t.lastName}`).join(', ') || 'Class Teachers'}
                    </p>
                  </div>
                </div>

                {/* RSVP Summary */}
                <div className="p-4 border border-border rounded-xl bg-surface/30">
                  <span className="text-xs font-bold text-deep uppercase tracking-wider block mb-2">RSVP Responses</span>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-emerald-50 text-forest rounded-lg">
                      <span className="text-xs font-semibold block">Going</span>
                      <strong className="text-base">
                        {activeMeetingDetail.rsvps?.filter((r) => r.response === 'going').length || 0}
                      </strong>
                    </div>
                    <div className="p-2 bg-rose-50 text-danger rounded-lg">
                      <span className="text-xs font-semibold block">Not Going</span>
                      <strong className="text-base">
                        {activeMeetingDetail.rsvps?.filter((r) => r.response === 'not_going').length || 0}
                      </strong>
                    </div>
                    <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                      <span className="text-xs font-semibold block">Maybe</span>
                      <strong className="text-base">
                        {activeMeetingDetail.rsvps?.filter((r) => r.response === 'maybe').length || 0}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ATTENDANCE */}
            {detailTab === 'attendance' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted text-[11px]">
                  <span>Mark parent attendance during or after the meeting</span>
                  <span>Total invited: <strong>{activeMeetingDetail.attendance?.length || 0}</strong></span>
                </div>

                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {activeMeetingDetail.attendance?.length === 0 ? (
                    <div className="p-6 text-center text-muted">No attendance records generated yet</div>
                  ) : (
                    activeMeetingDetail.attendance?.map((att) => {
                      const parentName = att.parentId ? `${att.parentId.firstName} ${att.parentId.lastName}` : 'Parent';
                      const studentName = att.studentId ? `${att.studentId.firstName} ${att.studentId.lastName}` : 'Student';
                      const currentClass = att.studentId?.currentClass?.name || 'Class';

                      return (
                        <div key={att._id} className="p-3 bg-white hover:bg-surface/50 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-deep">{parentName}</div>
                            <div className="text-[11px] text-muted">
                              Student: <span className="font-medium text-secondary">{studentName} ({currentClass})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateAttendanceStatus(att.parentId?._id || att.parentId, att.studentId?._id || att.studentId, 'attended')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                att.status === 'attended'
                                  ? 'bg-forest text-white'
                                  : 'bg-surface border border-border text-secondary hover:bg-emerald-50'
                              }`}
                            >
                              Attended
                            </button>
                            <button
                              onClick={() => handleUpdateAttendanceStatus(att.parentId?._id || att.parentId, att.studentId?._id || att.studentId, 'absent')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                att.status === 'absent'
                                  ? 'bg-danger text-white'
                                  : 'bg-surface border border-border text-secondary hover:bg-rose-50'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleUpdateAttendanceStatus(att.parentId?._id || att.parentId, att.studentId?._id || att.studentId, 'pending')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                att.status === 'pending'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-surface border border-border text-secondary'
                              }`}
                            >
                              Pending
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: NOTES */}
            {detailTab === 'notes' && (
              <div className="space-y-4 text-xs">
                {/* Note Editor Form */}
                <div className="p-4 border border-border rounded-xl bg-surface/30 space-y-3">
                  <span className="text-xs font-bold text-deep uppercase tracking-wider block">Add / Update Student Notes</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-deep block mb-1">Select Student</label>
                      <select
                        value={noteForm.studentId}
                        onChange={(e) => handleOpenAddNote(e.target.value)}
                        className="w-full text-xs bg-white border border-border rounded-lg px-3 py-1.5 text-deep font-medium cursor-pointer"
                      >
                        <option value="">-- Choose Student --</option>
                        {activeMeetingDetail.attendance?.map((att) => {
                          const s = att.studentId;
                          if (!s) return null;
                          return (
                            <option key={s._id || s} value={s._id || s}>
                              {s.firstName} {s.lastName} ({s.admissionNo || 'STU'})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-deep block mb-1">Note Visibility</label>
                      <select
                        value={noteForm.visibility}
                        onChange={(e) => setNoteForm({ ...noteForm, visibility: e.target.value })}
                        className="w-full text-xs bg-white border border-border rounded-lg px-3 py-1.5 text-deep font-medium cursor-pointer"
                      >
                        <option value="parent_visible">Parent Visible (Parent can view)</option>
                        <option value="internal">Internal Only (Staff only)</option>
                      </select>
                    </div>
                  </div>

                  {noteForm.studentId && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={noteForm.academicNotes}
                          onChange={(e) => setNoteForm({ ...noteForm, academicNotes: e.target.value })}
                          placeholder="Academic Performance (e.g. Good progress in Math)"
                          className="w-full text-xs bg-white border border-border rounded-lg px-3 py-1.5 text-deep"
                        />
                        <input
                          type="text"
                          value={noteForm.behaviourNotes}
                          onChange={(e) => setNoteForm({ ...noteForm, behaviourNotes: e.target.value })}
                          placeholder="Behaviour (e.g. Participates actively)"
                          className="w-full text-xs bg-white border border-border rounded-lg px-3 py-1.5 text-deep"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={noteForm.improvementNotes}
                          onChange={(e) => setNoteForm({ ...noteForm, improvementNotes: e.target.value })}
                          placeholder="Areas to Improve (e.g. Reading comprehension)"
                          className="w-full text-xs bg-white border border-border rounded-lg px-3 py-1.5 text-deep"
                        />
                        <input
                          type="text"
                          value={noteForm.actionItems}
                          onChange={(e) => setNoteForm({ ...noteForm, actionItems: e.target.value })}
                          placeholder="Action Items (e.g. Practice 20 mins daily)"
                          className="w-full text-xs bg-white border border-border rounded-lg px-3 py-1.5 text-deep"
                        />
                      </div>
                      <Button size="sm" onClick={handleSaveNoteSubmit} className="text-xs py-1.5 bg-forest text-white font-bold">
                        Save Notes
                      </Button>
                    </div>
                  )}
                </div>

                {/* Existing Notes List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(activeMeetingDetail.notes || []).length === 0 ? (
                    <div className="p-4 text-center text-muted border border-dashed border-border rounded-xl">
                      No meeting notes added yet.
                    </div>
                  ) : (
                    activeMeetingDetail.notes.map((n) => {
                      const studentName = n.studentId ? `${n.studentId.firstName} ${n.studentId.lastName}` : 'Student';
                      return (
                        <div key={n._id} className="p-3 bg-white border border-border rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-deep">{studentName}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              n.visibility === 'parent_visible' ? 'bg-emerald-50 text-forest' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {n.visibility === 'parent_visible' ? 'Parent Visible' : 'Internal'}
                            </span>
                          </div>
                          {n.academicNotes && <p className="text-[11px] text-secondary"><strong>Academic:</strong> {n.academicNotes}</p>}
                          {n.behaviourNotes && <p className="text-[11px] text-secondary"><strong>Behaviour:</strong> {n.behaviourNotes}</p>}
                          {n.improvementNotes && <p className="text-[11px] text-secondary"><strong>Improvements:</strong> {n.improvementNotes}</p>}
                          {n.actionItems && <p className="text-[11px] text-secondary"><strong>Action Items:</strong> {n.actionItems}</p>}
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
