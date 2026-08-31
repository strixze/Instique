import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Plus, Trash2, Edit2, Upload, GraduationCap, Users, BookOpen, Building2,
  Search, RotateCcw, Filter, MoreVertical, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, ChevronsUpDown,
  Key, Mail, AlertTriangle, RefreshCw, ShieldCheck,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { teacherApi } from '../../api/teacher.api';
import { academicApi } from '../../api/academic.api';
import BulkImportModal from '../../components/ui/BulkImportModal';
import UserAvatar from '../../components/ui/UserAvatar';

/* ──────────────────────── Constants ──────────────────────── */

const STATUS_PILLS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const emptyForm = {
  firstName: '',
  lastName: '',
  employeeId: '',
  gender: 'male',
  dateOfBirth: '',
  department: '',
  phone: '',
  email: '',
  subjects: [],
};

export default function Teachers() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Account action modals
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Subject data
  const [allSubjects, setAllSubjects] = useState([]);

  // Action menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    academicApi.getSubjects({ limit: 200 }).then((res) => setAllSubjects(res.data)).catch(() => { });
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const params = {
          page,
          limit: 10,
          search: search || undefined,
          sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
        };
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (genderFilter && genderFilter !== 'all') params.gender = genderFilter;

        const res = await teacherApi.getAll(params);
        if (!active) return;
        setData(res.data || []);
        setMeta(res.meta || null);
      } catch (err) {
        if (!active) return;
        toast.error('Failed to load teachers');
        setData([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    const timer = setTimeout(load, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [page, search, statusFilter, genderFilter, sortField, sortOrder, reload]);

  // Derived stats
  const totalCount = meta?.total || data.length;
  const activeCount = data.filter((t) => t.status === 'active').length;
  const depts = new Set(data.map((t) => t.department).filter(Boolean)).size;

  const allTeacherSubjects = new Set();
  data.forEach((t) => {
    if (Array.isArray(t.subjects)) {
      t.subjects.forEach((s) => {
        if (typeof s === 'string') allTeacherSubjects.add(s);
        else if (s?.name) allTeacherSubjects.add(s.name);
      });
    }
  });
  const subjectCount = allTeacherSubjects.size;

  const subjectMap = {};
  allSubjects.forEach((s) => { subjectMap[s._id] = s.name; });

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setGenderFilter('all');
    setSortField('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted/50 dark:text-dark-text-muted/50 ml-1" />;
    return sortOrder === 'asc' ? (
      <ChevronUp size={13} className="text-forest dark:text-emerald-400 ml-1 font-bold" />
    ) : (
      <ChevronDown size={13} className="text-forest dark:text-emerald-400 ml-1 font-bold" />
    );
  };

  // Create / Edit modal handlers
  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      employeeId: row.employeeId || '',
      gender: row.gender || 'male',
      dateOfBirth: row.dateOfBirth ? row.dateOfBirth.substring(0, 10) : '',
      department: row.department || '',
      phone: row.contact?.phone || '',
      email: row.contact?.email || '',
      subjects: Array.isArray(row.subjects) ? row.subjects.map((s) => (typeof s === 'string' ? s : s._id)) : [],
    });
    setEditId(row._id);
    setOpen(true);
  };

  const handleSubjectToggle = (subId) => {
    setForm((prev) => {
      const exists = prev.subjects.includes(subId);
      return {
        ...prev,
        subjects: exists ? prev.subjects.filter((id) => id !== subId) : [...prev.subjects, subId],
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        employeeId: form.employeeId,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        department: form.department || undefined,
        contact: {
          phone: form.phone || undefined,
          email: form.email || undefined,
        },
        subjects: form.subjects,
      };

      if (editId) {
        await teacherApi.update(editId, payload);
        toast.success('Teacher updated successfully');
      } else {
        await teacherApi.create(payload);
        toast.success('Teacher created successfully! Login credentials generated.');
      }
      setOpen(false);
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Delete Teacher?',
      text: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });

    if (result.isConfirmed) {
      try {
        await teacherApi.delete(id);
        toast.success('Teacher deleted successfully');
        setReload((r) => r + 1);
      } catch (err) {
        toast.error(err?.message || 'Failed to delete teacher');
      }
    }
  };

  const handleToggleStatus = async (row) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    try {
      await teacherApi.update(row._id, { status: newStatus });
      toast.success(`Teacher marked as ${newStatus}`);
      setReload((r) => r + 1);
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  const handleSendResetLink = async () => {
    if (!resetTarget) return;
    setActionLoading(true);
    try {
      const res = await teacherApi.sendPasswordReset(resetTarget._id);
      toast.success(res.message || 'Password reset link sent to teacher email');
      setResetModalOpen(false);
      setResetTarget(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to send password reset email');
    } finally {
      setActionLoading(false);
    }
  };

  /* ──────────────────────── Render Helpers ──────────────────────── */

  const renderStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary border border-slate-200 dark:border-dark-border">
        {status || 'Inactive'}
      </span>
    );
  };

  const renderAccountStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          ● Active
        </span>
      );
    }
    if (status === 'PENDING_ACTIVATION') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
          ● Pending
        </span>
      );
    }
    if (status === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
          ● Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary border border-slate-200 dark:border-dark-border">
        Not Linked
      </span>
    );
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight">Teachers</h1>
          <p className="text-secondary dark:text-dark-text-secondary text-xs mt-1 max-w-xl leading-relaxed">Manage teacher profiles, subjects, assignments, and account access.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1.5"><Upload size={14} /> Bulk Import</Button>
          <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus size={15} /> Add Teacher</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-forest-soft dark:bg-dark-accent-soft text-forest dark:text-emerald-400 flex items-center justify-center mb-2"><GraduationCap size={15} strokeWidth={1.8} /></div>
          <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Total Teachers</p>
          <p className="text-2xl font-bold text-deep dark:text-dark-text leading-none mt-1">{totalCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2"><Users size={15} strokeWidth={1.8} /></div>
          <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-deep dark:text-dark-text leading-none mt-1">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2"><Building2 size={15} strokeWidth={1.8} /></div>
          <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Departments</p>
          <p className="text-2xl font-bold text-deep dark:text-dark-text leading-none mt-1">{depts}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2"><BookOpen size={15} strokeWidth={1.8} /></div>
          <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Subjects Covered</p>
          <p className="text-2xl font-bold text-deep dark:text-dark-text leading-none mt-1">{subjectCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-text-muted" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text placeholder-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-secondary dark:text-dark-text-secondary">
              <span className="font-semibold text-muted dark:text-dark-text-muted text-[11px]">Gender</span>
              <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500">
                <option value="all">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs text-secondary dark:text-dark-text-secondary gap-1"><RotateCcw size={12} /> Reset</Button>
          </div>
        </div>
        <div className="pt-2 border-t border-border/70 dark:border-dark-border flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted dark:text-dark-text-muted text-[11px] uppercase tracking-wide mr-1">Status:</span>
          <div className="flex flex-wrap gap-1">
            {STATUS_PILLS.map((pill) => {
              const isActive = statusFilter === pill.value;
              return (
                <button key={pill.value} onClick={() => { setStatusFilter(pill.value); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${isActive ? 'bg-forest dark:bg-emerald-500 text-white dark:text-gray-900 shadow-2xs' : 'text-secondary dark:text-dark-text-secondary hover:bg-surface dark:hover:bg-dark-hover hover:text-deep dark:hover:text-dark-text'}`}>
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border dark:border-dark-border bg-surface/70 dark:bg-dark-elevated">
                <th onClick={() => handleSort('employeeId')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:text-deep dark:hover:text-dark-text select-none">
                  <div className="flex items-center gap-1"><span>EMPLOYEE ID</span><SortIcon field="employeeId" /></div>
                </th>
                <th onClick={() => handleSort('firstName')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:text-deep dark:hover:text-dark-text select-none">
                  <div className="flex items-center gap-1"><span>TEACHER</span><SortIcon field="firstName" /></div>
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider">DEPARTMENT</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider">SUBJECTS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider">ACCOUNT</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider">STATUS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-dark-border bg-white dark:bg-dark-card">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}><td colSpan={7} className="px-3.5 py-3"><div className="h-5 bg-surface dark:bg-dark-hover rounded animate-pulse w-full" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-muted dark:text-dark-text-muted">No teachers found matching the selected criteria.</td></tr>
              ) : (
                data.map((row) => {
                  const subjectNames = Array.isArray(row.subjects) ? row.subjects.map(s => typeof s === 'string' ? (subjectMap[s] || s) : (s.name || subjectMap[s._id] || '—')) : [];
                  const accountStatus = row.accountStatus || 'NOT_LINKED';

                  return (
                    <tr key={row._id} className="hover:bg-surface/50 dark:hover:bg-dark-hover transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-xs text-deep dark:text-dark-text font-mono">{row.employeeId || '—'}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            type="teacher"
                            gender={row.gender}
                            id={row._id}
                            employeeId={row.employeeId}
                            name={`${row.firstName} ${row.lastName}`}
                            size="sm"
                            className="shrink-0 ring-1 ring-border/50 dark:ring-dark-border"
                          />
                          <div>
                            <p className="font-bold text-xs text-deep dark:text-dark-text leading-tight">{row.firstName} {row.lastName}</p>
                            {row.contact?.email && <p className="text-[11px] text-muted dark:text-dark-text-muted leading-tight mt-0.5">{row.contact.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-xs text-secondary dark:text-dark-text-secondary font-medium">{row.department || '—'}</td>
                      <td className="px-3.5 py-2.5 text-xs">
                        {subjectNames.length === 0 ? (
                          <span className="text-muted dark:text-dark-text-muted">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {subjectNames.slice(0, 3).map((name, sIdx) => (
                              <span key={sIdx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                                {name}
                              </span>
                            ))}
                            {subjectNames.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary">
                                +{subjectNames.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">{renderAccountStatusBadge(accountStatus)}</td>
                      <td className="px-3.5 py-2.5">{renderStatusBadge(row.status)}</td>
                      <td className="px-3.5 py-2.5 text-right relative">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)}
                            className="p-1.5 text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text hover:bg-surface dark:hover:bg-dark-hover border border-border dark:border-dark-border rounded-lg transition-colors cursor-pointer"
                            title="More actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                        {activeMenuId === row._id && (
                          <div ref={menuRef} className="absolute right-4 top-10 w-52 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                            <button
                              onClick={() => { setActiveMenuId(null); openEdit(row); }}
                              className="w-full px-3 py-2 text-xs font-medium text-deep dark:text-dark-text hover:bg-surface dark:hover:bg-dark-hover flex items-center gap-2"
                            >
                              <Edit2 size={13} className="text-secondary dark:text-dark-text-secondary" /> Edit Profile
                            </button>
                            <button
                              onClick={() => { setActiveMenuId(null); handleToggleStatus(row); }}
                              className="w-full px-3 py-2 text-xs font-medium text-deep dark:text-dark-text hover:bg-surface dark:hover:bg-dark-hover flex items-center gap-2"
                            >
                              <RefreshCw size={13} className="text-secondary dark:text-dark-text-secondary" /> Toggle Active Status
                            </button>
                            {accountStatus === 'ACTIVE' && (
                              <button
                                onClick={() => { setActiveMenuId(null); setResetTarget(row); setResetModalOpen(true); }}
                                className="w-full px-3 py-2 text-xs font-medium text-forest dark:text-emerald-400 hover:bg-forest/5 dark:hover:bg-dark-accent-soft flex items-center gap-2"
                              >
                                <Key size={13} className="text-forest dark:text-emerald-400" /> Send Password Reset
                              </button>
                            )}
                            <div className="my-1 border-t border-border dark:border-dark-border" />
                            <button
                              onClick={() => { setActiveMenuId(null); handleDelete(row._id, `${row.firstName} ${row.lastName}`); }}
                              className="w-full px-3 py-2 text-xs font-medium text-danger dark:text-rose-400 hover:bg-danger-light dark:hover:bg-rose-500/10 flex items-center gap-2"
                            >
                              <Trash2 size={13} className="text-danger dark:text-rose-400" /> Delete Teacher
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border dark:border-dark-border bg-slate-50/40 dark:bg-dark-elevated text-xs">
            <span className="text-muted dark:text-dark-text-muted">
              Showing {((meta.page - 1) * meta.limit) + (meta.total > 0 ? 1 : 0)} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={loading || !meta.hasPrevPage} onClick={() => setPage((p) => p - 1)} className="p-1 px-2 text-xs">
                <ChevronLeft size={14} />
              </Button>
              <span className="font-medium text-secondary dark:text-dark-text-secondary px-1">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={loading || !meta.hasNextPage} onClick={() => setPage((p) => p + 1)} className="p-1 px-2 text-xs">
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Edit Teacher Profile' : 'Add New Teacher'}
        description={editId ? 'Update teacher information and subject assignments' : 'Add teacher profile. Login credentials will be generated automatically.'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="First Name *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input label="Last Name *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Employee ID *" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="e.g. TCH-001" required />
            <Select
              label="Gender *"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              required
            />
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Mathematics" />
            <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
            <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teacher@school.edu" />
          </div>

          {/* Subject Assignments */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-deep dark:text-dark-text">Assigned Subjects</label>
            <p className="text-[11px] text-muted dark:text-dark-text-muted">Select subjects this teacher is qualified to teach across classes.</p>
            <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              {allSubjects.map((sub) => {
                const checked = form.subjects.includes(sub._id);
                return (
                  <label key={sub._id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white dark:hover:bg-dark-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleSubjectToggle(sub._id)}
                      className="rounded border-border text-forest focus:ring-forest/20 dark:bg-dark-card"
                    />
                    <span className="font-medium text-deep dark:text-dark-text truncate">{sub.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-dark-border">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editId ? 'Save Changes' : 'Create Teacher'}</Button>
          </div>
        </form>
      </Modal>

      {/* Send Password Reset Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Send Password Reset Link"
        description="This will send an email with a password reset link to the teacher."
        size="sm"
      >
        {resetTarget && (
          <div className="space-y-4">
            <div className="p-3 bg-forest-soft dark:bg-dark-accent-soft rounded-xl text-xs space-y-1">
              <p className="font-bold text-deep dark:text-dark-text">{resetTarget.firstName} {resetTarget.lastName}</p>
              <p className="text-secondary dark:text-dark-text-secondary font-mono">Employee ID: {resetTarget.employeeId}</p>
              <p className="text-muted dark:text-dark-text-muted">Email: {resetTarget.contact?.email || '—'}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-dark-border">
              <Button variant="ghost" onClick={() => setResetModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSendResetLink} loading={actionLoading}>Send Reset Link</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        entityType="teachers"
        onSuccess={() => setReload((r) => r + 1)}
      />
    </div>
  );
}
