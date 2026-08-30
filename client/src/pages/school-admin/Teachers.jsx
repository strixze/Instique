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
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load teachers');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, statusFilter, genderFilter, sortField, sortOrder]);

  /* ──────────────────────── Helpers ──────────────────────── */

  const subjectMap = Object.fromEntries(allSubjects.map((s) => [s._id, s.name]));
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const resetAndClose = () => { setForm(emptyForm); setEditId(null); setOpen(false); };
  const triggerReload = () => { setLoading(true); setReload((r) => r + 1); };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setGenderFilter('all');
    setPage(1);
    setLoading(true);
  };

  const countActiveFilters = () => {
    let count = 0;
    if (statusFilter && statusFilter !== 'all') count++;
    if (genderFilter && genderFilter !== 'all') count++;
    if (search) count++;
    return count;
  };

  /* ──────────────────────── Sorting ──────────────────────── */

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted/60" />;
    return sortOrder === 'asc' ? <ChevronUp size={13} className="text-forest" /> : <ChevronDown size={13} className="text-forest" />;
  };

  /* ──────────────────────── KPI Stats ──────────────────────── */

  const totalCount = meta?.total || 0;
  const activeCount = data.filter(t => t.status === 'active').length;
  const depts = [...new Set(data.map(t => t.department).filter(Boolean))].length;
  const subjectCount = [...new Set(data.flatMap(t => Array.isArray(t.subjects) ? t.subjects.map(s => (typeof s === 'string' ? s : s._id)) : []))].length;

  /* ──────────────────────── CRUD ──────────────────────── */

  const openCreate = () => { setForm(emptyForm); setEditId(null); setOpen(true); };

  const openEdit = (teacher) => {
    setForm({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      employeeId: teacher.employeeId || '',
      gender: teacher.gender || 'male',
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString().split('T')[0] : '',
      department: teacher.department || '',
      phone: teacher.contact?.phone || '',
      email: teacher.contact?.email || '',
      subjects: Array.isArray(teacher.subjects)
        ? teacher.subjects.map((s) => (typeof s === 'string' ? s : s._id || s))
        : [],
    });
    setEditId(teacher._id);
    setOpen(true);
  };

  const toggleSubject = (subjectId) => {
    setForm((f) => {
      const subjects = [...f.subjects];
      const idx = subjects.indexOf(subjectId);
      if (idx >= 0) subjects.splice(idx, 1);
      else subjects.push(subjectId);
      return { ...f, subjects };
    });
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.employeeId) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!editId && !form.email) {
      toast.error('Teacher email is required for account creation and login');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        employeeId: form.employeeId,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        department: form.department || undefined,
        contact: { phone: form.phone || undefined, email: form.email || undefined },
        subjects: form.subjects,
      };
      if (editId) {
        await teacherApi.update(editId, payload);
        toast.success('Teacher updated');
        resetAndClose();
        triggerReload();
      } else {
        const res = await teacherApi.create(payload);
        const created = res.data || res;
        resetAndClose();

        if (created?.activationEmailSent) {
          toast.success(
            `✓ Teacher created! Activation email sent to ${created.activationEmailAddress}`,
            { duration: 5000 }
          );
        } else if (created?.activationEmailAddress) {
          toast.error(
            `Teacher created, but activation email failed to send. Use "Resend Activation Email" from the teacher's action menu.`,
            { duration: 7000 }
          );
        } else {
          toast.success('Teacher created successfully');
        }

        setPage(1);
        triggerReload();
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (teacher) => {
    Swal.fire({
      title: 'Delete teacher?',
      text: `${teacher.firstName} ${teacher.lastName} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await teacherApi.delete(teacher._id);
        toast.success('Teacher deleted');
        triggerReload();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete teacher');
      }
    });
  };

  /* ──────────────────────── Account Actions ──────────────────────── */

  const handleResendActivation = async (teacher) => {
    setActiveMenuId(null);
    setActionLoading(true);
    try {
      const res = await teacherApi.resendActivation(teacher._id);
      toast.success(res.message || `Activation email resent to ${teacher.contact?.email}`);
    } catch (e) {
      toast.error(e?.message || 'Failed to resend activation email');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPasswordReset = (teacher) => {
    setActiveMenuId(null);
    setResetTarget(teacher);
    setResetModalOpen(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!resetTarget) return;
    setActionLoading(true);
    try {
      const res = await teacherApi.sendPasswordReset(resetTarget._id);
      toast.success(res.message || `Password reset link sent to ${resetTarget.contact?.email}`);
      setResetModalOpen(false);
      setResetTarget(null);
    } catch (e) {
      toast.error(e?.message || 'Failed to send password reset email');
    } finally {
      setActionLoading(false);
    }
  };

  /* ──────────────────────── Render Helpers ──────────────────────── */

  const renderGender = (gender) => {
    if (gender === 'female') return <span className="inline-flex items-center gap-1 text-xs font-medium text-pink-600">Female</span>;
    if (gender === 'male') return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">Male</span>;
    return <span className="text-xs text-muted capitalize">{gender || '—'}</span>;
  };

  const renderStatusBadge = (status) => {
    if (status === 'active') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">{status || 'Inactive'}</span>;
  };

  const renderAccountStatusBadge = (accountStatus) => {
    if (!accountStatus || accountStatus === 'NOT_LINKED') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded border bg-slate-50 text-slate-500 border-slate-200">
          Not Linked
        </span>
      );
    }
    if (accountStatus === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Active
        </span>
      );
    }
    if (accountStatus === 'PENDING_ACTIVATION') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border bg-amber-50 text-amber-700 border-amber-200 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Pending
        </span>
      );
    }
    if (accountStatus === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border bg-rose-50 text-rose-700 border-rose-200 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          Suspended
        </span>
      );
    }
    return null;
  };

  /* ──────────────────────── RENDER ──────────────────────── */

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-deep tracking-tight">Teachers</h1>
          <p className="text-secondary text-xs mt-1 max-w-xl leading-relaxed">Manage teacher profiles, subjects, assignments, and account access.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1.5"><Upload size={14} /> Bulk Import</Button>
          <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus size={15} /> Add Teacher</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-forest-soft text-forest flex items-center justify-center mb-2"><GraduationCap size={15} strokeWidth={1.8} /></div>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Total Teachers</p>
          <p className="text-2xl font-bold text-deep leading-none mt-1">{totalCount}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2"><Users size={15} strokeWidth={1.8} /></div>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-deep leading-none mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><Building2 size={15} strokeWidth={1.8} /></div>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Departments</p>
          <p className="text-2xl font-bold text-deep leading-none mt-1">{depts}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2"><BookOpen size={15} strokeWidth={1.8} /></div>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Subjects Covered</p>
          <p className="text-2xl font-bold text-deep leading-none mt-1">{subjectCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted text-[11px]">Gender</span>
              <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }} className="px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest">
                <option value="all">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs text-secondary gap-1"><RotateCcw size={12} /> Reset</Button>
          </div>
        </div>
        <div className="pt-2 border-t border-border/70 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted text-[11px] uppercase tracking-wide mr-1">Status:</span>
          <div className="flex flex-wrap gap-1">
            {STATUS_PILLS.map((pill) => {
              const isActive = statusFilter === pill.value;
              return (
                <button key={pill.value} onClick={() => { setStatusFilter(pill.value); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${isActive ? 'bg-forest text-white shadow-2xs' : 'text-secondary hover:bg-surface hover:text-deep'}`}>
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/70">
                <th onClick={() => handleSort('employeeId')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none">
                  <div className="flex items-center gap-1"><span>EMPLOYEE ID</span><SortIcon field="employeeId" /></div>
                </th>
                <th onClick={() => handleSort('firstName')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none">
                  <div className="flex items-center gap-1"><span>TEACHER</span><SortIcon field="firstName" /></div>
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">DEPARTMENT</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">SUBJECTS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">ACCOUNT</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">STATUS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}><td colSpan={7} className="px-3.5 py-3"><div className="h-5 bg-surface rounded animate-pulse w-full" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-muted">No teachers found matching the selected criteria.</td></tr>
              ) : (
                data.map((row) => {
                  const subjectNames = Array.isArray(row.subjects) ? row.subjects.map(s => typeof s === 'string' ? (subjectMap[s] || s) : (s.name || subjectMap[s._id] || '—')) : [];
                  const accountStatus = row.accountStatus || 'NOT_LINKED';

                  return (
                    <tr key={row._id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-xs text-deep font-mono">{row.employeeId || '—'}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            type="teacher"
                            gender={row.gender}
                            id={row._id}
                            employeeId={row.employeeId}
                            name={`${row.firstName} ${row.lastName}`}
                            size="sm"
                            className="shrink-0 ring-1 ring-border/50"
                          />
                          <div>
                            <p className="font-bold text-xs text-deep leading-tight">{row.firstName} {row.lastName}</p>
                            {row.contact?.email && <p className="text-[11px] text-muted leading-tight mt-0.5">{row.contact.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-xs text-secondary font-medium">{row.department || '—'}</td>
                      <td className="px-3.5 py-2.5">
                        {subjectNames.length === 0 ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {subjectNames.slice(0, 3).map((name, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">{name}</span>
                            ))}
                            {subjectNames.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-muted border border-border">+{subjectNames.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {renderAccountStatusBadge(accountStatus)}
                      </td>
                      <td className="px-3.5 py-2.5">{renderStatusBadge(row.status)}</td>
                      <td className="px-3.5 py-2.5 text-right relative">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)}
                            className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors cursor-pointer"
                            title="More actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        {activeMenuId === row._id && (
                          <div ref={menuRef} className="absolute right-4 top-10 w-56 bg-white border border-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                            {/* Edit */}
                            <button
                              onClick={() => { setActiveMenuId(null); openEdit(row); }}
                              className="w-full px-3 py-2 text-xs text-deep hover:bg-surface flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 size={13} className="text-muted" /> Edit Teacher
                            </button>

                            {/* Account Actions based on status */}
                            <div className="border-t border-border/60 mt-1 pt-1">
                              {accountStatus === 'PENDING_ACTIVATION' ? (
                                <button
                                  onClick={() => handleResendActivation(row)}
                                  disabled={actionLoading}
                                  className="w-full px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer font-medium disabled:opacity-50"
                                >
                                  <RefreshCw size={13} className="text-amber-600 shrink-0" />
                                  Resend Activation Email
                                </button>
                              ) : accountStatus === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleOpenPasswordReset(row)}
                                  className="w-full px-3 py-2 text-xs text-forest hover:bg-forest/5 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <Key size={13} className="text-forest shrink-0" />
                                  Send Password Reset
                                </button>
                              ) : accountStatus === 'SUSPENDED' ? (
                                <div className="px-3 py-2 text-xs text-rose-600 flex items-center gap-2">
                                  <AlertTriangle size={13} className="shrink-0" />
                                  Account Suspended
                                </div>
                              ) : (
                                <div className="px-3 py-2 text-xs text-muted flex items-center gap-2">
                                  <Mail size={13} className="shrink-0" />
                                  No account linked
                                </div>
                              )}
                            </div>

                            {/* Delete */}
                            <div className="border-t border-border/60 mt-1 pt-1">
                              <button
                                onClick={() => { setActiveMenuId(null); handleDelete(row); }}
                                className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} /> Delete Teacher
                              </button>
                            </div>
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

        {meta && (
          <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border bg-surface/30">
            <span className="text-xs text-muted">
              Showing {((meta.page - 1) * meta.limit) + (meta.total > 0 ? 1 : 0)} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={loading || !meta.hasPrevPage} onClick={() => setPage(meta.page - 1)} className="p-1 px-2 text-xs"><ChevronLeft size={14} /></Button>
              {Array.from({ length: meta.totalPages || 1 }, (_, idx) => idx + 1).map((pageNum) => (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold transition-all ${meta.page === pageNum ? 'bg-forest text-white' : 'bg-white border border-border text-secondary hover:bg-surface'}`}>
                  {pageNum}
                </button>
              ))}
              <Button variant="outline" size="sm" disabled={loading || !meta.hasNextPage} onClick={() => setPage(meta.page + 1)} className="p-1 px-2 text-xs"><ChevronRight size={14} /></Button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      <Modal isOpen={open} onClose={resetAndClose} title={editId ? 'Edit Teacher' : 'Add Teacher'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name *" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="Jane" />
          <Input label="Last name *" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Smith" />
          <Input label="Employee ID *" value={form.employeeId} onChange={(e) => setField('employeeId', e.target.value)} placeholder="TCH-001" disabled={!!editId} />
          <Select label="Gender" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} value={form.gender} onChange={(e) => setField('gender', e.target.value)} />
          <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} />
          <Input label="Department" value={form.department} onChange={(e) => setField('department', e.target.value)} placeholder="Science" />
          <Input label="Phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 90000 00000" />
          <div>
            <Input
              label={editId ? 'Email' : 'Email *'}
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="teacher@school.edu"
              disabled={!!editId}
            />
            {!editId && (
              <p className="text-[11px] text-muted mt-1">
                Required for account setup. Teacher will receive a login activation email.
              </p>
            )}
          </div>
        </div>

        {/* Multi-Subject Selection */}
        <div className="mt-6">
          <label className="text-sm font-medium text-secondary mb-2 block">Subjects (select multiple)</label>
          {allSubjects.length === 0 ? (
            <p className="text-sm text-muted">No subjects found. Create subjects in the Academic section first.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-white/60 border border-border rounded-xl">
              {allSubjects.map((subject) => {
                const isSelected = form.subjects.includes(subject._id);
                return (
                  <button key={subject._id} type="button" onClick={() => toggleSubject(subject._id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border ${isSelected ? 'bg-sage border-forest text-forest' : 'bg-white border-border text-muted hover:border-border hover:text-secondary'}`}>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${isSelected ? 'bg-forest border-forest text-white' : 'border-border'}`}>
                      {isSelected && '✓'}
                    </span>
                    {subject.name}
                  </button>
                );
              })}
            </div>
          )}
          {form.subjects.length > 0 && <p className="text-xs text-muted mt-1.5">{form.subjects.length} subject{form.subjects.length > 1 ? 's' : ''} selected</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editId ? 'Update Teacher' : 'Create Teacher'}</Button>
        </div>
      </Modal>

      {/* ── SEND PASSWORD RESET CONFIRMATION MODAL ── */}
      {resetTarget && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => { if (!actionLoading) { setResetModalOpen(false); setResetTarget(null); } }}
          title="Send Password Reset Link"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-forest-soft border border-forest/20 rounded-xl">
              <div className="flex items-start gap-2.5">
                <Key size={18} className="text-forest shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-deep">Send Password Reset</p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    A secure, single-use reset link will be sent via Brevo to the teacher's email.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-border rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted">Teacher:</span>
                <span className="font-bold text-deep">{resetTarget.firstName} {resetTarget.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Employee ID:</span>
                <span className="font-mono text-deep">{resetTarget.employeeId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Email:</span>
                <span className="text-deep truncate max-w-36">{resetTarget.contact?.email || '—'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setResetModalOpen(false); setResetTarget(null); }} disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleConfirmPasswordReset} loading={actionLoading} className="gap-1.5">
                <Key size={14} /> Send Reset Link
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <BulkImportModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} entityType="teachers" onSuccess={() => triggerReload()} />
    </div>
  );
}
