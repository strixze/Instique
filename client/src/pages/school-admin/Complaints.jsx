import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  MessageSquare, Plus, Search, Filter, RotateCcw,
  Clock, CheckCircle2, AlertCircle, RefreshCw, XCircle,
  FileText, User, Users, Calendar, ArrowRight, Paperclip,
  Eye, Edit3, ShieldAlert, Send, ArrowUpRight, Award, ChevronRight
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import DataTable from '../../components/ui/DataTable';
import { complaintApi } from '../../api/complaint.api';
import { studentApi } from '../../api/student.api';
import { teacherApi } from '../../api/teacher.api';
import { useUserStore } from '../../store/userStore';

// ── Categories & Status Config ──
const COMPLAINT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'academic', label: 'Academic' },
  { value: 'teacher_staff', label: 'Teacher / Staff' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'homework', label: 'Homework' },
  { value: 'examination', label: 'Examination' },
  { value: 'fees', label: 'Fees' },
  { value: 'transport', label: 'Transport' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'safety', label: 'Safety' },
  { value: 'student_behaviour', label: 'Student Behaviour' },
  { value: 'bullying', label: 'Bullying' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'administration', label: 'Administration' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  open: { label: 'Open', color: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  under_review: { label: 'Under Review', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress: { label: 'In Progress', color: 'purple', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  resolved: { label: 'Resolved', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', color: 'gray', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  rejected: { label: 'Rejected', color: 'red', bg: 'bg-red-50 text-red-700 border-red-200' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  medium: { label: 'Medium', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'High', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgent', bg: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' },
};

function getStatusBadge(status) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function getPriorityBadge(priority) {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority || 'Medium', bg: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

export default function Complaints() {
  const user = useUserStore((s) => s.user);
  const isSchoolAdmin = user?.role === 'school_admin' || user?.role === 'super_admin';

  // ── Main Data State ──
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Reference lists
  const [studentsList, setStudentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);

  // ── Filters & Pagination ──
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  // ── Modals State ──
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);
  const [saving, setSaving] = useState(false);

  // Submit Form State
  const [createForm, setCreateForm] = useState({
    subject: '',
    category: 'academic',
    priority: 'medium',
    description: '',
    student: '',
    isAnonymous: false,
  });

  // Action Process Form State
  const [processForm, setProcessForm] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    note: '',
    resolution: '',
  });

  // Load Reference Data (Students & Staff)
  useEffect(() => {
    studentApi.getAll({ limit: 100 })
      .then((res) => setStudentsList(res.data || []))
      .catch(() => {});

    teacherApi.getAll({ limit: 100 })
      .then((res) => setTeachersList(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch Stats
  const fetchStats = () => {
    setStatsLoading(true);
    complaintApi.getStats()
      .then((res) => setStats(res.data || {}))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  // Fetch Complaints
  const fetchComplaints = () => {
    setLoading(true);
    const params = {
      page,
      limit: 10,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      source: sourceFilter !== 'all' ? sourceFilter : undefined,
      dateRange: dateRangeFilter !== 'all' ? dateRangeFilter : undefined,
    };

    complaintApi.getAll(params)
      .then((res) => {
        setComplaints(res.data || []);
        setMeta(res.meta || null);
      })
      .catch((e) => {
        toast.error(e?.message || 'Failed to load complaints');
        setComplaints([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, priorityFilter, categoryFilter, sourceFilter, dateRangeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSourceFilter('all');
    setDateRangeFilter('all');
    setPage(1);
    fetchComplaints();
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (statusFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (sourceFilter !== 'all') count++;
    if (dateRangeFilter !== 'all') count++;
    return count;
  }, [search, statusFilter, priorityFilter, categoryFilter, sourceFilter, dateRangeFilter]);

  // Open Detail Drawer
  const openDetails = async (complaint) => {
    try {
      const res = await complaintApi.getById(complaint._id);
      const fullDoc = res.data;
      setDetailComplaint(fullDoc);
      setProcessForm({
        status: fullDoc.status,
        priority: fullDoc.priority || 'medium',
        assignedTo: fullDoc.assignedTo?._id || '',
        note: '',
        resolution: fullDoc.resolution || '',
      });
    } catch (e) {
      setDetailComplaint(complaint);
      setProcessForm({
        status: complaint.status,
        priority: complaint.priority || 'medium',
        assignedTo: complaint.assignedTo?._id || '',
        note: '',
        resolution: complaint.resolution || '',
      });
    }
  };

  // Submit New Complaint
  const handleCreateSubmit = async () => {
    if (!createForm.subject.trim() || !createForm.description.trim()) {
      toast.error('Subject and Description are required');
      return;
    }

    setSaving(true);
    try {
      let selectedStudentName = '';
      if (createForm.student) {
        const found = studentsList.find((s) => s._id === createForm.student);
        if (found) selectedStudentName = `${found.firstName || ''} ${found.lastName || ''}`.trim() || found.name;
      }

      await complaintApi.create({
        ...createForm,
        studentName: selectedStudentName,
      });

      toast.success('Complaint submitted successfully');
      setCreateModalOpen(false);
      setCreateForm({
        subject: '',
        category: 'academic',
        priority: 'medium',
        description: '',
        student: '',
        isAnonymous: false,
      });
      fetchComplaints();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to submit complaint');
    } finally {
      setSaving(false);
    }
  };

  // Process / Update Complaint
  const handleProcessSubmit = async () => {
    if (!detailComplaint) return;
    setSaving(true);
    try {
      const updatedRes = await complaintApi.process(detailComplaint._id, {
        status: processForm.status,
        priority: processForm.priority,
        assignedTo: processForm.assignedTo || undefined,
        note: processForm.note || undefined,
        resolution: processForm.resolution || undefined,
      });

      toast.success('Complaint updated successfully');
      setDetailComplaint(updatedRes.data);
      setProcessForm((prev) => ({ ...prev, note: '' }));
      fetchComplaints();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to update complaint');
    } finally {
      setSaving(false);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'referenceNo',
      label: 'Reference #',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-forest">
          {r.referenceNo || `CMP-${r._id.slice(-5).toUpperCase()}`}
        </span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject & Category',
      render: (r) => (
        <div>
          <span
            onClick={() => openDetails(r)}
            className="text-xs font-bold text-deep hover:text-forest transition-colors cursor-pointer block truncate max-w-xs"
          >
            {r.subject}
          </span>
          <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider block mt-0.5">
            {r.category?.replace('_', ' ') || 'General'}
          </span>
        </div>
      ),
    },
    {
      key: 'complainant',
      label: 'Submitted By',
      render: (r) => (
        <div>
          <span className="text-xs font-semibold text-deep block">
            {r.isAnonymous ? 'Anonymous' : (r.complainantName || r.complainant?.name || 'User')}
          </span>
          <span className="text-[10px] text-muted capitalize block">
            {r.type || r.complainantRole || 'Student'} {r.studentName ? `(${r.studentName})` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (r) => getPriorityBadge(r.priority),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => getStatusBadge(r.status),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (r) => (
        <span className="text-xs text-muted">
          {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDetails(r)}
          className="text-xs py-1 px-2.5 flex items-center gap-1"
        >
          View <ChevronRight size={13} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight flex items-center gap-2">
            <MessageSquare className="text-forest" size={24} />
            Complaints & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Review and resolve student and parent concerns effectively
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 text-xs py-2 bg-forest hover:bg-forest/90 text-white font-semibold rounded-xl shadow-xs"
        >
          <Plus size={16} /> Submit Complaint
        </Button>
      </div>

      {/* ── 2. Summary Statistics (5 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total */}
        <Card padding={false} className="p-3.5 bg-white border border-border rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted block">Total Complaints</span>
            <div className="text-lg font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-5 w-6 inline-block" /> : stats.total || 0}
            </div>
            <span className="text-[10px] text-secondary">All Time</span>
          </div>
        </Card>

        {/* Card 2: Submitted / New */}
        <Card padding={false} className="p-3.5 bg-white border border-border rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted block">New / Submitted</span>
            <div className="text-lg font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-5 w-6 inline-block" /> : stats.submitted || 0}
            </div>
            <span className="text-[10px] text-rose-600 font-semibold">Requires Review</span>
          </div>
        </Card>

        {/* Card 3: Under Review */}
        <Card padding={false} className="p-3.5 bg-white border border-border rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted block">Under Review</span>
            <div className="text-lg font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-5 w-6 inline-block" /> : stats.underReview || 0}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">In Evaluation</span>
          </div>
        </Card>

        {/* Card 4: In Progress */}
        <Card padding={false} className="p-3.5 bg-white border border-border rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <RefreshCw size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted block">In Progress</span>
            <div className="text-lg font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-5 w-6 inline-block" /> : stats.inProgress || 0}
            </div>
            <span className="text-[10px] text-purple-600 font-semibold">Assigned & Active</span>
          </div>
        </Card>

        {/* Card 5: Resolved */}
        <Card padding={false} className="p-3.5 bg-white border border-border rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-forest flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted block">Resolved</span>
            <div className="text-lg font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-5 w-6 inline-block" /> : stats.resolved || 0}
            </div>
            <span className="text-[10px] text-forest font-semibold">Action Complete</span>
          </div>
        </Card>
      </div>

      {/* ── 3. Search & Filter Bar ── */}
      <Card padding={false} className="p-4 bg-white border border-border rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Complaint #, subject, student or submitter..."
              className="w-full text-xs bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-deep focus:outline-none focus:border-forest"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Reset & Active Filter Badge */}
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

      {/* ── 4. Complaints DataTable ── */}
      <DataTable
        columns={columns}
        data={complaints}
        loading={loading}
        meta={meta}
        onPageChange={(p) => { setLoading(true); setPage(p); }}
        onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }}
        searchPlaceholder="Filter listed complaints..."
      />

      {/* ── 5. Submit Complaint Modal ── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Submit New Complaint / Concern"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Subject / Brief Summary *"
            value={createForm.subject}
            onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
            placeholder="e.g. School Bus Route Delay or Homework Overload"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category *"
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
              options={COMPLAINT_CATEGORIES.filter((c) => c.value !== 'all')}
            />

            <Select
              label="Priority *"
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium (Default)' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </div>

          {/* Student Selector (If Admin or Parent submitting) */}
          <Select
            label="Concerned Student / Child (Optional)"
            value={createForm.student}
            onChange={(e) => setCreateForm({ ...createForm, student: e.target.value })}
            options={[
              { value: '', label: 'General / No Specific Student' },
              ...studentsList.map((s) => ({
                value: s._id,
                label: `${s.firstName || ''} ${s.lastName || ''} (${s.admissionNo || 'Student'})`,
              })),
            ]}
          />

          <div>
            <label className="text-xs font-semibold text-deep block mb-1">Detailed Description *</label>
            <textarea
              rows={4}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Please describe your concern in detail so the administration can investigate and take appropriate action..."
              className="w-full text-xs bg-surface border border-border rounded-lg p-2.5 text-deep focus:outline-none focus:border-forest"
            />
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-deep">
              <input
                type="checkbox"
                checked={createForm.isAnonymous}
                onChange={(e) => setCreateForm({ ...createForm, isAnonymous: e.target.checked })}
                className="rounded border-border text-forest focus:ring-forest"
              />
              <span>Submit Anonymously (Hide My Identity)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} loading={saving} className="bg-forest text-white">
              Submit Complaint
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 6. Complaint Details & Action Drawer / Modal ── */}
      {detailComplaint && (
        <Modal
          isOpen={!!detailComplaint}
          onClose={() => setDetailComplaint(null)}
          title={`Complaint ${detailComplaint.referenceNo || ''}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Header Title & Badges */}
            <div className="flex items-start justify-between gap-3 bg-surface/50 border border-border rounded-xl p-3.5">
              <div>
                <span className="font-mono text-xs font-bold text-forest block">
                  {detailComplaint.referenceNo || `CMP-${detailComplaint._id.slice(-5).toUpperCase()}`}
                </span>
                <h2 className="text-base font-bold text-deep mt-0.5">{detailComplaint.subject}</h2>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityBadge(detailComplaint.priority)}
                {getStatusBadge(detailComplaint.status)}
              </div>
            </div>

            {/* Submitter & Student Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface/30 border border-border rounded-xl p-3">
              <div>
                <span className="text-[10px] text-muted uppercase font-bold block">Submitted By</span>
                <span className="font-semibold text-deep block mt-0.5">
                  {detailComplaint.isAnonymous ? 'Anonymous' : (detailComplaint.complainantName || detailComplaint.complainant?.name || 'User')}
                </span>
                <span className="text-[10px] text-muted capitalize">{detailComplaint.type || 'Student'}</span>
              </div>

              <div>
                <span className="text-[10px] text-muted uppercase font-bold block">Category</span>
                <span className="font-semibold text-deep capitalize block mt-0.5">
                  {detailComplaint.category?.replace('_', ' ') || 'General'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted uppercase font-bold block">Student / Class</span>
                <span className="font-semibold text-deep block mt-0.5">
                  {detailComplaint.studentName || detailComplaint.student?.name || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted uppercase font-bold block">Assigned Staff</span>
                <span className="font-semibold text-deep block mt-0.5">
                  {detailComplaint.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <span className="text-xs font-bold text-deep block mb-1">Description</span>
              <p className="text-xs text-secondary leading-relaxed p-3.5 bg-surface/40 border border-border rounded-xl whitespace-pre-wrap">
                {detailComplaint.description}
              </p>
            </div>

            {/* Resolution Note if present */}
            {detailComplaint.resolution && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl p-3.5">
                <span className="text-xs font-bold text-forest block mb-1 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Resolution Note
                </span>
                <p className="text-xs leading-relaxed">{detailComplaint.resolution}</p>
              </div>
            )}

            {/* Activity History Timeline */}
            <div className="border-t border-border pt-3">
              <span className="text-xs font-bold text-deep block mb-2">Activity Timeline</span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(detailComplaint.activities || []).map((act, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[11px] bg-surface/50 border border-border/60 p-2 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-forest shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-deep">{act.action}</span>
                        <span className="text-[10px] text-muted">
                          {new Date(act.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-muted text-[11px] mt-0.5">{act.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Action Form (Change Status, Assign Staff, Add Note) */}
            {isSchoolAdmin && (
              <div className="border-t border-border pt-3 space-y-3 bg-surface/40 p-3.5 rounded-xl border">
                <span className="text-xs font-bold text-deep block">Update Complaint Status & Assignment</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Status *"
                    value={processForm.status}
                    onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                    options={[
                      { value: 'submitted', label: 'Submitted' },
                      { value: 'under_review', label: 'Under Review' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'closed', label: 'Closed' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                  />

                  <Select
                    label="Priority"
                    value={processForm.priority}
                    onChange={(e) => setProcessForm({ ...processForm, priority: e.target.value })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]}
                  />

                  <Select
                    label="Assign Staff Member"
                    value={processForm.assignedTo}
                    onChange={(e) => setProcessForm({ ...processForm, assignedTo: e.target.value })}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...teachersList.map((t) => ({
                        value: t.userId?._id || t._id,
                        label: `${t.firstName || ''} ${t.lastName || ''} (${t.employeeId || 'Staff'})`.trim() || t.name,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-deep block mb-1">Resolution / Action Note</label>
                  <textarea
                    rows={2}
                    value={processForm.resolution}
                    onChange={(e) => setProcessForm({ ...processForm, resolution: e.target.value })}
                    placeholder="Enter resolution notes or updates for complainant..."
                    className="w-full text-xs bg-white border border-border rounded-lg p-2 text-deep focus:outline-none focus:border-forest"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProcessSubmit} loading={saving} className="bg-forest text-white text-xs py-1.5">
                    Save Updates
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
