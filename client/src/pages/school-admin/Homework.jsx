import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  BookMarked,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  FileText,
  Paperclip,
  Download,
  Trash2,
  Edit,
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Users,
  X,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  Sparkles,
  Upload,
  EyeOff,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { homeworkApi } from '../../api/homework.api';
import { parentApi } from '../../api/parent.api';
import { settingApi } from '../../api/setting.api';
import { useUserStore } from '../../store/userStore';

const statusConfig = {
  published: { label: 'Published', color: 'success', icon: CheckCircle2 },
  draft: { label: 'Draft', color: 'warning', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'gray', icon: XCircle },
};

function getFileIcon(mimeType, filename = '') {
  if (mimeType?.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    return ImageIcon;
  }
  if (mimeType?.includes('sheet') || mimeType?.includes('excel') || /\.(xlsx|xls|csv)$/i.test(filename)) {
    return FileSpreadsheet;
  }
  if (mimeType?.includes('pdf') || /\.pdf$/i.test(filename)) {
    return FileText;
  }
  return File;
}

function getUrgencyBadge(dueDateStr, status) {
  if (status === 'cancelled') return { label: 'Cancelled', color: 'bg-slate-100 text-slate-600' };
  if (status === 'draft') return { label: 'Draft Mode', color: 'bg-amber-50 text-amber-700 border-amber-200' };

  const due = new Date(dueDateStr);
  const now = new Date();
  const diffHours = (due - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    return { label: 'Overdue', color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
  }
  if (diffHours <= 24) {
    return { label: 'Due Today', color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' };
  }
  if (diffHours <= 48) {
    return { label: 'Due Tomorrow', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
  }
  const days = Math.ceil(diffHours / 24);
  return { label: `Due in ${days} days`, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
}

export default function Homework() {
  const user = useUserStore((s) => s.user);
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'school_admin' || user?.role === 'super_admin';
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';

  // ── State ──
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [studentTab, setStudentTab] = useState('all'); // all, upcoming, completed, overdue

  // Teacher Assignments (for Create/Edit form)
  const [assignments, setAssignments] = useState({ classes: [], sections: [], subjects: [], teachers: [] });

  // Parent linked children
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schoolClass: '',
    section: '',
    subject: '',
    teacher: '',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'published',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  // Student submission state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [canCreateHomework, setCanCreateHomework] = useState(true);
  const [isModuleDisabled, setIsModuleDisabled] = useState(false);

  // ── 1. Fetch Teacher Assignments & Permissions on Mount ──
  useEffect(() => {
    if (isTeacherOrAdmin) {
      homeworkApi.getMyAssignments()
        .then((res) => {
          setAssignments(res.data || { classes: [], sections: [], subjects: [], teachers: [] });
        })
        .catch(() => { });

      if (user?.role === 'teacher') {
        settingApi.getPublic()
          .then((res) => {
            const data = res.data?.data || res.data;
            if (data?.visibility?.teacherPolicy?.canCreateHomework === false) {
              setCanCreateHomework(false);
            }
          })
          .catch(() => { });
      }
    }
  }, [isTeacherOrAdmin, user?.role]);

  // ── 2. Fetch Parent Linked Children & Visibility ──
  useEffect(() => {
    if (isParent) {
      Promise.allSettled([
        parentApi.getMyChildren(),
        settingApi.getPublic()
      ]).then(([kidsRes, settingsRes]) => {
        if (settingsRes.status === 'fulfilled') {
          const data = settingsRes.value?.data?.data || settingsRes.value?.data;
          if (data?.visibility?.parent?.homework === false || data?.features?.homework === false) {
            setIsModuleDisabled(true);
          }
        }
        if (kidsRes.status === 'fulfilled') {
          const kids = kidsRes.value?.data || [];
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(kids[0].id || kids[0]._id);
          }
        }
      }).catch(() => { });
    }
  }, [isParent]);

  // ── 3. Fetch Homework List ──
  useEffect(() => {
    let active = true;
    const fetchList = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          schoolClass: classFilter || undefined,
          section: sectionFilter || undefined,
          subject: subjectFilter || undefined,
          studentId: isParent ? selectedChildId : undefined,
          filter: studentTab !== 'all' ? studentTab : undefined,
        };

        const res = await homeworkApi.getAll(params);
        if (!active) return;
        setHomeworkList(res.data || []);
        setMeta(res.meta);
      } catch (err) {
        if (active) toast.error(err?.message || 'Failed to load homework');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchList();
    return () => { active = false; };
  }, [page, search, statusFilter, classFilter, sectionFilter, subjectFilter, selectedChildId, studentTab, reload]);

  // Sections filtered by selected form class
  const formSections = useMemo(() => {
    if (!formData.schoolClass) return [];
    return (assignments.sections || []).filter(
      (s) => !s.schoolClass || s.schoolClass.toString() === formData.schoolClass.toString()
    );
  }, [assignments.sections, formData.schoolClass]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      schoolClass: assignments.classes[0]?._id || '',
      section: '',
      subject: assignments.subjects[0]?._id || '',
      teacher: '',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'published',
    });
    setSelectedFiles([]);
    setExistingAttachments([]);
    setEditingId(null);
    setCreateModalOpen(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    if (assignments.classes.length > 0) {
      setFormData((f) => ({
        ...f,
        schoolClass: assignments.classes[0]._id,
        subject: assignments.subjects[0]?._id || '',
      }));
    }
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (hw) => {
    setEditingId(hw._id);
    setFormData({
      title: hw.title,
      description: hw.description || '',
      schoolClass: hw.schoolClass?._id || hw.schoolClass,
      section: hw.section?._id || hw.section || '',
      subject: hw.subject?._id || hw.subject,
      teacher: hw.teacher?._id || hw.teacher || '',
      assignedDate: hw.assignedDate ? new Date(hw.assignedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: hw.dueDate ? new Date(hw.dueDate).toISOString().split('T')[0] : '',
      status: hw.status || 'published',
    });
    setExistingAttachments(hw.attachments || []);
    setSelectedFiles([]);
    setCreateModalOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length + existingAttachments.length > 5) {
      toast.error('Maximum 5 files allowed per assignment');
      return;
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveHomework = async (targetStatus) => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.schoolClass) {
      toast.error('Class is required');
      return;
    }
    if (!formData.subject) {
      toast.error('Subject is required');
      return;
    }
    if (!formData.dueDate) {
      toast.error('Due date is required');
      return;
    }

    if (new Date(formData.dueDate) < new Date(formData.assignedDate)) {
      toast.error('Due date cannot be before assigned date');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('description', formData.description.trim());
      payload.append('schoolClass', formData.schoolClass);
      if (formData.section) payload.append('section', formData.section);
      payload.append('subject', formData.subject);
      if (formData.teacher) payload.append('teacher', formData.teacher);
      payload.append('assignedDate', formData.assignedDate);
      payload.append('dueDate', formData.dueDate);
      payload.append('status', targetStatus || formData.status);
      payload.append('attachments', JSON.stringify(existingAttachments));

      // Append new files
      selectedFiles.forEach((file) => {
        payload.append('attachments', file);
      });

      if (editingId) {
        await homeworkApi.update(editingId, payload);
        toast.success('Homework updated successfully');
      } else {
        await homeworkApi.create(payload);
        toast.success(targetStatus === 'draft' ? 'Homework saved as draft' : 'Homework published and sent to students');
      }

      resetForm();
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to save homework');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishDraft = async (id) => {
    try {
      await homeworkApi.publish(id);
      toast.success('Homework published to students');
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to publish homework');
    }
  };

  const handleDelete = (hw) => {
    Swal.fire({
      title: 'Delete Homework?',
      text: `"${hw.title}" will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await homeworkApi.delete(hw._id);
        toast.success('Homework deleted');
        setReload((r) => r + 1);
      } catch (err) {
        toast.error(err?.message || 'Failed to delete homework');
      }
    });
  };

  const handleOpenDetails = (hw) => {
    setSelectedHomework(hw);
    setDetailsModalOpen(true);
  };

  // Student submission handler
  const handleOpenSubmit = (hw) => {
    setSelectedHomework(hw);
    setSubmissionContent('');
    setSubmissionFiles([]);
    setSubmitModalOpen(true);
  };

  const handleSubmitHomework = async () => {
    if (!selectedHomework) return;
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('content', submissionContent);
      submissionFiles.forEach((f) => payload.append('attachments', f));

      await homeworkApi.submit(selectedHomework._id, payload);
      toast.success('Homework submitted successfully');
      setSubmitModalOpen(false);
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to submit homework');
    } finally {
      setSubmitting(false);
    }
  };

  // KPI stats for teachers/admins
  const kpiStats = useMemo(() => {
    const total = homeworkList.length;
    const published = homeworkList.filter((h) => h.status === 'published').length;
    const drafts = homeworkList.filter((h) => h.status === 'draft').length;
    const dueSoon = homeworkList.filter((h) => {
      if (h.status !== 'published') return false;
      const d = new Date(h.dueDate);
      const now = new Date();
      const diff = (d - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    }).length;

    return { total, published, drafts, dueSoon };
  }, [homeworkList]);

  if (isParent && isModuleDisabled) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center p-8 bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl shadow-xs space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <EyeOff size={28} />
        </div>
        <h2 className="text-lg font-bold text-deep dark:text-dark-text">Homework Portal Restricted</h2>
        <p className="text-xs text-muted max-w-md mx-auto">
          Viewing student homework assignments is currently disabled for parents by your school administrator.
        </p>
        <div className="pt-2">
          <Button onClick={() => window.location.href = '/dashboard'} variant="primary" size="sm">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="Homework & Assignments"
        description={
          isTeacherOrAdmin
            ? 'Create, manage, and assign homework to your authorized classes and subjects.'
            : 'Track upcoming assignments, download attachments, and view submission statuses.'
        }
        action={
          isTeacherOrAdmin && (user?.role !== 'teacher' || canCreateHomework) ? (
            <Button onClick={handleOpenCreate} className="gap-2 text-xs">
              <Plus size={16} /> Create Homework
            </Button>
          ) : null
        }
      />

      {/* ── Multi-Child Selector for Parents ── */}
      {isParent && children.length > 0 && (
        <div className="bg-white border border-border/80 rounded-2xl p-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-forest ml-2 mr-1" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Select Child:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {children.map((child) => {
                const childId = child.id || child._id;
                const isSelected = childId === selectedChildId;
                return (
                  <button
                    key={childId}
                    onClick={() => setSelectedChildId(childId)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${isSelected
                        ? 'bg-forest text-white border-forest shadow-md shadow-forest/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-border/80'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'}`}>
                      {child.firstName?.[0]}
                    </div>
                    <span>{child.firstName} {child.lastName}</span>
                    {child.currentClass?.name && (
                      <span className={`text-[10px] opacity-80 px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}>
                        {child.currentClass.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Summary Cards (Teacher / Admin) ── */}
      {isTeacherOrAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Total Assignments</span>
              <BookMarked size={16} className="text-forest" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-deep">{meta?.total ?? kpiStats.total}</span>
              <span className="text-[10px] text-muted block mt-0.5">Created across classes</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Active Published</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-emerald-700">{kpiStats.published}</span>
              <span className="text-[10px] text-muted block mt-0.5">Visible to students</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Due This Week</span>
              <Clock size={16} className="text-amber-600" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-amber-700">{kpiStats.dueSoon}</span>
              <span className="text-[10px] text-muted block mt-0.5">Approaching deadlines</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-border/80 rounded-2xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Drafts</span>
              <FileText size={16} className="text-slate-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-slate-700">{kpiStats.drafts}</span>
              <span className="text-[10px] text-muted block mt-0.5">Unpublished work</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Student / Parent Filter Tabs ── */}
      {(isStudent || isParent) && (
        <div className="flex gap-1 p-1 bg-white border border-border/80 rounded-xl w-fit shadow-2xs">
          {[
            { key: 'all', label: 'All Homework' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStudentTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${studentTab === tab.key ? 'bg-forest text-white shadow-xs' : 'text-muted hover:text-deep'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-border/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search homework by title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>

          {/* Class Filter */}
          {isTeacherOrAdmin && (
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter('');
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="">All Classes</option>
              {assignments.classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest"
          >
            <option value="">All Subjects</option>
            {assignments.subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          {/* Status Filter (Teacher / Admin) */}
          {isTeacherOrAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Homework Grid / Table ── */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white border border-border/80 rounded-2xl shadow-2xs text-muted">
          <div className="w-8 h-8 border-3 border-forest/30 border-t-forest rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-medium text-secondary">Loading homework assignments...</p>
        </div>
      ) : homeworkList.length === 0 ? (
        <div className="bg-white border border-border/80 rounded-2xl p-12 text-center text-muted shadow-2xs">
          <BookMarked size={44} className="mx-auto mb-3 opacity-30 text-forest" />
          <span className="font-semibold text-deep text-base block">No Homework Found</span>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            {isTeacherOrAdmin
              ? 'No homework assignments match your active filters. Click "Create Homework" to create one.'
              : 'There are no active homework assignments scheduled for this class right now.'}
          </p>
          {isTeacherOrAdmin && (
            <Button onClick={handleOpenCreate} className="mt-4 gap-2 text-xs">
              <Plus size={15} /> Create First Homework
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {homeworkList.map((hw) => {
            const urgency = getUrgencyBadge(hw.dueDate, hw.status);
            const formattedAssigned = hw.assignedDate ? new Date(hw.assignedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
            const formattedDue = hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
            const teacherName = hw.teacher ? `${hw.teacher.firstName} ${hw.teacher.lastName}` : 'Teacher';
            const statusCfg = statusConfig[hw.status] || statusConfig.published;

            return (
              <div
                key={hw._id}
                className="bg-white border border-border/80 hover:border-forest/40 rounded-2xl p-5 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Subject & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-forest-soft text-forest">
                        {hw.subject?.name || 'Subject'}
                      </span>
                      {hw.schoolClass?.name && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {hw.schoolClass.name} {hw.section?.name ? `(${hw.section.name})` : ''}
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${urgency.color}`}>
                      {urgency.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => handleOpenDetails(hw)}
                    className="text-sm font-bold text-deep group-hover:text-forest transition-colors cursor-pointer line-clamp-2 leading-snug"
                  >
                    {hw.title}
                  </h3>

                  {hw.description && (
                    <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {hw.description}
                    </p>
                  )}

                  {/* Attachment pills */}
                  {hw.attachments && hw.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {hw.attachments.map((att, i) => {
                        const Icon = getFileIcon(att.mimeType, att.name);
                        return (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-border rounded-lg text-[10px] font-medium text-secondary truncate max-w-44 transition-colors"
                            title={att.name}
                          >
                            <Icon size={11} className="shrink-0 text-forest" />
                            <span className="truncate">{att.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Footer */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted">
                  <div>
                    <span className="text-[10px] block text-muted">Due: <b className="text-deep">{formattedDue}</b></span>
                    <span className="text-[10px] text-muted">By: {teacherName}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenDetails(hw)}
                      className="p-1.5 text-muted hover:text-forest rounded-lg hover:bg-forest-soft transition-colors"
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>

                    {isTeacherOrAdmin && (
                      <>
                        {hw.status === 'draft' && (
                          <button
                            onClick={() => handlePublishDraft(hw._id)}
                            className="p-1.5 text-amber-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Publish Draft"
                          >
                            <Send size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(hw)}
                          className="p-1.5 text-muted hover:text-deep rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(hw)}
                          className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}

                    {isStudent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSubmit(hw)}
                        className="text-xs px-2.5 py-1"
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT HOMEWORK MODAL ── */}
      {isTeacherOrAdmin && (
        <Modal
          isOpen={createModalOpen}
          onClose={resetForm}
          title={editingId ? 'Edit Homework Assignment' : 'Create New Homework'}
          size="lg"
        >
          <div className="space-y-4">
            {/* Row 1: Class, Section, Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Class *</label>
                <select
                  value={formData.schoolClass}
                  onChange={(e) => {
                    setFormData((f) => ({ ...f, schoolClass: e.target.value, section: '' }));
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest"
                >
                  <option value="">Select Class</option>
                  {assignments.classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Section (Optional)</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData((f) => ({ ...f, section: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest"
                >
                  <option value="">All Sections</option>
                  {formSections.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Subject *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest"
                >
                  <option value="">Select Subject</option>
                  {assignments.subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <Input
                label="Homework Title *"
                placeholder="e.g., Chapter 4: Quadratic Equations Worksheet"
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Description & Instructions */}
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Instructions & Description</label>
              <textarea
                rows={4}
                placeholder="Specify questions, textbook page numbers, references, or submission instructions..."
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-white border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest resize-none"
              />
            </div>

            {/* Row 2: Assigned Date & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Assigned Date"
                type="date"
                value={formData.assignedDate}
                onChange={(e) => setFormData((f) => ({ ...f, assignedDate: e.target.value }))}
              />
              <Input
                label="Due Date *"
                type="date"
                min={formData.assignedDate}
                value={formData.dueDate}
                onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>

            {/* File Attachments Dropzone */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Attachments (PDF, Images, Worksheets — Max 5 files)
              </label>

              <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="homework-file-input"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="homework-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-muted"
                >
                  <Upload size={20} className="text-forest opacity-70" />
                  <span className="text-xs font-semibold text-deep">
                    Click to upload worksheet or document files
                  </span>
                  <span className="text-[10px] text-muted">Supports PDF, DOCX, XLSX, Images up to 10MB</span>
                </label>
              </div>

              {/* Uploaded / Existing File List */}
              <div className="mt-3 space-y-1.5">
                {/* Existing attachments */}
                {existingAttachments.map((att, idx) => (
                  <div
                    key={`exist-${idx}`}
                    className="flex items-center justify-between p-2 bg-slate-50 border border-border rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-forest shrink-0" />
                      <span className="font-medium text-deep truncate">{att.name}</span>
                      <span className="text-[10px] text-muted">(Attached)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(idx)}
                      className="text-muted hover:text-danger p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* New files */}
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="flex items-center justify-between p-2 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={14} className="text-emerald-700 shrink-0" />
                      <span className="font-medium text-emerald-900 truncate">{file.name}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="text-emerald-700 hover:text-danger p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <Button variant="ghost" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  loading={saving}
                  onClick={() => handleSaveHomework('draft')}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  loading={saving}
                  onClick={() => handleSaveHomework('published')}
                  className="gap-1.5"
                >
                  <Send size={14} /> {editingId ? 'Update & Publish' : 'Publish Homework'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── HOMEWORK DETAILS MODAL ── */}
      {selectedHomework && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Homework Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-border rounded-xl">
              <div>
                <span className="text-xs font-bold text-forest uppercase block">
                  {selectedHomework.subject?.name}
                </span>
                <span className="text-xs font-semibold text-deep">
                  Class: {selectedHomework.schoolClass?.name} {selectedHomework.section?.name ? `(${selectedHomework.section.name})` : ''}
                </span>
              </div>

              <div className="text-right text-xs">
                <span className="text-muted block text-[10px]">
                  Assigned: {selectedHomework.assignedDate ? new Date(selectedHomework.assignedDate).toLocaleDateString() : '—'}
                </span>
                <span className="font-bold text-deep">
                  Due: {selectedHomework.dueDate ? new Date(selectedHomework.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-deep">{selectedHomework.title}</h4>
              <p className="text-xs text-secondary mt-2 leading-relaxed whitespace-pre-line bg-white p-3 border border-border/60 rounded-xl">
                {selectedHomework.description || 'No detailed instructions provided.'}
              </p>
            </div>

            {/* Attachments */}
            {selectedHomework.attachments && selectedHomework.attachments.length > 0 && (
              <div>
                <span className="text-xs font-bold text-secondary block mb-1.5">Attached Files:</span>
                <div className="space-y-1.5">
                  {selectedHomework.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-border rounded-xl text-xs font-semibold text-deep transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip size={14} className="text-forest shrink-0" />
                        <span className="truncate">{att.name}</span>
                      </div>
                      <Download size={14} className="text-muted shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Submissions Section (for teachers/admins) */}
            {isTeacherOrAdmin && (
              <div className="pt-3 border-t border-border">
                <span className="text-xs font-bold text-deep block mb-2">
                  Student Submissions ({selectedHomework.submissions?.length || 0})
                </span>
                {(!selectedHomework.submissions || selectedHomework.submissions.length === 0) ? (
                  <p className="text-xs text-muted italic">No students have submitted this assignment yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedHomework.submissions.map((sub, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-border rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-deep">
                            {sub.student?.firstName} {sub.student?.lastName}
                          </span>
                          <span className="text-[10px] text-muted block">
                            Submitted on {new Date(sub.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge color={sub.status === 'late' ? 'warning' : 'success'}>
                          {sub.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── STUDENT SUBMISSION MODAL ── */}
      {selectedHomework && isStudent && (
        <Modal
          isOpen={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          title={`Submit Homework: ${selectedHomework.title}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Answer / Notes</label>
              <textarea
                rows={4}
                placeholder="Type your answer, notes, or explanations here..."
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-border rounded-xl text-deep focus:outline-none focus:ring-1 focus:ring-forest resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Upload Work / Photos</label>
              <input
                type="file"
                multiple
                onChange={(e) => setSubmissionFiles(Array.from(e.target.files || []))}
                className="text-xs text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest-soft file:text-forest hover:file:bg-forest/20 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setSubmitModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitHomework} loading={submitting}>Submit Assignment</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
